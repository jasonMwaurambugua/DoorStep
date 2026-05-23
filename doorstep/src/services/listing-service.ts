import { Listing } from '../models/listing';
import { User } from '../models/user';

export class ListingService {
    private listings: Listing[] = [];

    public getAllListings(): Listing[] {
        return this.listings;
    }

    public getListingById(id: string): Listing | undefined {
        return this.listings.find(listing => listing.id === id);
    }

    public createListing(newListing: Listing): Listing {
        this.listings.push(newListing);
        return newListing;
    }

    public updateListing(id: string, updatedListing: Partial<Listing>): Listing | undefined {
        const index = this.listings.findIndex(listing => listing.id === id);
        if (index !== -1) {
            this.listings[index] = { ...this.listings[index], ...updatedListing };
            return this.listings[index];
        }
        return undefined;
    }

    public deleteListing(id: string): boolean {
        const index = this.listings.findIndex(listing => listing.id === id);
        if (index !== -1) {
            this.listings.splice(index, 1);
            return true;
        }
        return false;
    }
}