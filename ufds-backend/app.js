import express from "express";
import cors from "cors";
import helmet from "helmet";
const app = express()
app.use(helmet());
app.use(
    cors({
        origin:process.env.CLIENT_URL,
        credentials:true,
    })
);
app.use(express.json({
    limit:"1mb"
}));
app.get('/', (req, res)=>{
    res.status(200).json({
        success:true,
        message:"Welcome to Storvex Backend",
    })
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    service: "Storvex API",
  });
});
export default app