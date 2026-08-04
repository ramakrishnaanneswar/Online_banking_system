import express from "express";

const router = express.Router();

console.log("✅ authRoutes loaded");

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Auth Root Working"
  });
});

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Test Working"
  });
});
console.log("Login route loaded");
router.post("/login", (req, res) => {
  res.json({
    success: true,
    message: "Login Route Working"
  });
});

export default router;