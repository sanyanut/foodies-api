import prisma from "../../prisma/prisma.ts";

export const getAllTestimonials = async () => {
    return await prisma.testimonial.findMany();
};

