export interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    location: string;
    images: string[];
    createdAt: Date;
    updatedAt: Date;
    type: 'sale' | 'rental';
    bedrooms: number;
    bathrooms: number;
    area: number; // in square feet
    amenities?: string[];
    isFeatured?: boolean;
}