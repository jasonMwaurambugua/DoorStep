export interface Rental {
    id: string;
    rentalPrice: number;
    availability: boolean;
    listingId: string;
    createdAt: Date;
    updatedAt: Date;
}