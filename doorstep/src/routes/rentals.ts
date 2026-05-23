import { Router } from 'express';
import RentalsController from '../controllers/rentals';

const router = Router();
const rentalsController = new RentalsController();

export function setRentalsRoutes(app) {
    app.use('/api/rentals', router);
    
    router.get('/', rentalsController.getAllRentals.bind(rentalsController));
    router.get('/:id', rentalsController.getRentalById.bind(rentalsController));
    router.post('/', rentalsController.createRental.bind(rentalsController));
    router.put('/:id', rentalsController.updateRental.bind(rentalsController));
    router.delete('/:id', rentalsController.deleteRental.bind(rentalsController));
}