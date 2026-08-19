import prisma from "../../prisma/prisma.ts";

export const getAllTestimonials = () =>
    prisma.testimonial.findMany({
        take: 3,
        include: { owner: { select: { name: true } } },
    });

