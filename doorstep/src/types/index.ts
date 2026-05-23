export interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    location: string;
    images: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface User {
    id: string;
    username: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    createdAt: Date;
    updatedAt: Date;
}

export interface Rental {
    id: string;
    rentalPrice: number;
    availability: boolean;
    listingId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Review {
    id: string;
    rating: number;
    comment: string;
    listingId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}