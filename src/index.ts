import express from "express";

const app = express();
app.use(express.json());
// app.use("/api", router);

const PORT = parseInt(process.env["PORT"] ?? "3000", 10);
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});