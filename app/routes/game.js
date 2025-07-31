import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
    res.sendFile("game.html", { root: "views" });
});

export default router;