import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'POST':
      // Create a new holiday
      try {
        const { date } = req.body;
        const holiday = await prisma.holiday.create({
          data: { date },
        });
        res.status(201).json(holiday);
      } catch (error) {
        res.status(400).json({ error: 'Unable to create holiday' });
      }
      break;

    case 'GET':
      // Get all holidays or a specific holiday by ID
      try {
        const { id } = req.query;
        if (id) {
          const holiday = await prisma.holiday.findUnique({
            where: { id: Number(id) },
          });
          if (holiday) {
            res.status(200).json(holiday);
          } else {
            res.status(404).json({ error: 'Holiday not found' });
          }
        } else {
          const holidays = await prisma.holiday.findMany();
          res.status(200).json(holidays);
        }
      } catch (error) {
        res.status(500).json({ error: 'Unable to fetch holidays' });
      }
      break;

    case 'PUT':
      // Update a holiday
      try {
        const { id } = req.query;
        const { date } = req.body;
        const holiday = await prisma.holiday.update({
          where: { id: Number(id) },
          data: { date },
        });
        res.status(200).json(holiday);
      } catch (error) {
        res.status(400).json({ error: 'Unable to update holiday' });
      }
      break;

    case 'DELETE':
      // Delete a holiday
      try {
        const { id } = req.query;
        await prisma.holiday.delete({
          where: { id: Number(id) },
        });
        res.status(204).end();
      } catch (error) {
        res.status(400).json({ error: 'Unable to delete holiday' });
      }
      break;

    default:
      res.setHeader('Allow', ['POST', 'GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
