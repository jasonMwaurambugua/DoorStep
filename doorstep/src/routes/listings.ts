import { Router } from 'express';
import { ListingsController } from '../controllers/listings';

const router = Router();
const listingsController = new ListingsController();

export function setListingsRoutes(app: Router) {
    app.get('/listings', listingsController.getAllListings.bind(listingsController));
    app.get('/listings/:id', listingsController.getListingById.bind(listingsController));
    app.post('/listings', listingsController.createListing.bind(listingsController));
    app.put('/listings/:id', listingsController.updateListing.bind(listingsController));
    app.delete('/listings/:id', listingsController.deleteListing.bind(listingsController));
}