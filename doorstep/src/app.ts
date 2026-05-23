import express from 'express';
import { json } from 'body-parser';
import { setListingsRoutes } from './routes/listings';
import { setUsersRoutes } from './routes/users';
import { setAuthRoutes } from './routes/auth';
import { setRentalsRoutes } from './routes/rentals';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(json());

setListingsRoutes(app);
setUsersRoutes(app);
setAuthRoutes(app);
setRentalsRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});