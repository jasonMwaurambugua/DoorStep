export interface Review {
    id: string;
    listingId: string;
    userId: string;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
}

export class ReviewModel {
    constructor(
        public id: string,
        public listingId: string,
        public userId: string,
        public rating: number,
        public comment: string,
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date()
    ) {}
}