import prisma from "@/lib/prisma";
import { SubjectRepositoryInterface } from "../interface/SubjectRepositoryInterface";
import { Subject, SubjectCreateInput, SubjectUpdateInput } from "@/type/Subject";

export class SubjectRepository implements SubjectRepositoryInterface {
    /**
     * Retrieves all Subject entities.
     * 
     * @returns A promise that resolves to an array of Subject entities.
     */
    async getAll(): Promise<Subject[]> {
        return await prisma.subject.findMany();
    }

    /**
     * Retrieves a Subject entity by its ID.
     * 
     * @param id - The unique identifier of the Subject.
     * @returns A promise that resolves to the Subject entity.
     * @throws {Error} If no Subject with the given ID is found.
     */
    async getById(id: number): Promise<Subject> {
        const subject = await prisma.subject.findUnique({ where: { id } });
        if (!subject) {
            throw new Error(`Subject with ID ${id} does not exist.`);
        }
        return subject;
    }

    /**
     * Creates a new Subject entity.
     * 
     * @param item - The Subject data to create.
     * @returns A promise that resolves to the created Subject entity.
     */
    async create(item: SubjectCreateInput): Promise<Subject> {
        return await prisma.subject.create({ data: item });
    }

    /**
     * Updates an existing Subject entity.
     * 
     * @param item - The Subject data to update.
     * @returns A promise that resolves to the updated Subject entity.
     */
    async update(item: SubjectUpdateInput): Promise<Subject> {
        const subject = await this.getById(item.id as number);
        return await prisma.subject.update({
            where: { id: subject.id },
            data: item,
        });
    }

    /**
     * Deletes a Subject entity by its ID.
     * 
     * @param id - The unique identifier of the Subject to delete.
     * @returns A promise that resolves to true if deletion is successful.
     * @throws {Error} If no Subject with the given ID is found.
     */
    async deleteById(id: number): Promise<void> {
        const subject = await this.getById(id);
        await prisma.subject.delete({ where: { id: subject.id } })
    }
}
