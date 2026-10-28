import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import e from "express";
import Book from "./models/bookModel.js";
import { json } from "express";

configDotenv();

const mongoUrl = process.env.MONGO_URI;
const portNumber = process.env.PORT;

const app = e();

app.use(json());

const apiPath = "/api/books";

mongoose.connect(mongoUrl)
    .then(() => {
        console.log("Connected");
    })
    .catch(() => {
        console.log("failed");
    });

app.listen(portNumber, () => {
    console.log("server listening on port");
});

app.get(`${apiPath}`, async (req, res) => {
    try {
        const pageNumber = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.limit, 10) || 10;

        const validPage = pageNumber < 1 ? 1 : pageNumber;
        const validLimit = pageSize < 1 ? 10 : pageSize;

        const skipCount = (validPage - 1) * validLimit;

        const bookTotal = await Book.countDocuments();
        const totalPageCount = Math.ceil(bookTotal / validLimit);

        const nextAvailable = validPage < totalPageCount;

        const bookData = await Book.find()
            .skip(skipCount)
            .limit(validLimit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            books: bookData,
            metaData: {
                page: validPage,
                limit: validLimit,
                totalBooks: bookTotal,
                totalPages: totalPageCount,
                hasNext: nextAvailable
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
});

app.post(`${apiPath}`, async (req, res) => {
    try {
        const {
            title,
            author,
            availablity,
            category
        } = req.body;

        const bookEntry = new Book({
            title,
            author,
            category,
            availablity
        });

        const savedBook = await bookEntry.save();

        res.status(200).json({
            success: true,
            book: savedBook
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
});

app.patch(`${apiPath}/:id`, async (req, res) => {
    try {
        const { id: bookId } = req.params;
        const { availablity: availabilityStatus } = req.body;

        const changedBook = await Book.findByIdAndUpdate(
            bookId,
            {
                availablity: availabilityStatus
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!changedBook) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.status(200).json({
            message: "updated",
            book: changedBook
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
});