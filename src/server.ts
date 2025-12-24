import express from 'express';
import cors from 'cors';
import "dotenv/config";
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import institutionRoutes from './routes/institutionRoutes';
import placementRoutes from './routes/placementRoutes';
const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/institutions', institutionRoutes);
app.use('/placements', placementRoutes);

app.get('/ping', (_, res) => {
  res.send('pong');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});