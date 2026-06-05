import { Prisma, Role } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { hashPassword } from '../../utils/password';
import { serializeUser } from '../../utils/serialize';
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from './user.schemas';

type Actor = {
  id: string;
  role: Role;
};

export async function listUsers(query: ListUsersQuery) {
  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' } },
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } }
          ]
        }
      : {})
  };

  const skip = (query.page - 1) * query.limit;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: query.limit
    }),
    prisma.user.count({ where })
  ]);

  return {
    items: users.map(serializeUser),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit)
    }
  };
}

export async function getUserById(id: string, actor: Actor) {
  enforceSelfOrAdmin(id, actor);

  const user = await prisma.user.findUnique({
    where: {
      id
    }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return serializeUser(user);
}

export async function createUser(input: CreateUserInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (existingUser) {
    throw new HttpError(409, 'A user with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      isActive: input.isActive ?? true
    }
  });

  return serializeUser(user);
}

export async function updateUser(id: string, input: UpdateUserInput, actor: Actor) {
  enforceSelfOrAdmin(id, actor);

  if (actor.role !== Role.ADMIN && ('role' in input || 'isActive' in input)) {
    throw new HttpError(403, 'Only admins can change role or active status');
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      id
    }
  });

  if (!existingUser) {
    throw new HttpError(404, 'User not found');
  }

  if (input.email && input.email !== existingUser.email) {
    const userWithEmail = await prisma.user.findUnique({
      where: {
        email: input.email
      }
    });

    if (userWithEmail) {
      throw new HttpError(409, 'A user with this email already exists');
    }
  }

  const user = await prisma.user.update({
    where: {
      id
    },
    data: {
      email: input.email,
      passwordHash: input.password ? await hashPassword(input.password) : undefined,
      firstName: input.firstName,
      lastName: input.lastName,
      role: actor.role === Role.ADMIN ? input.role : undefined,
      isActive: actor.role === Role.ADMIN ? input.isActive : undefined
    }
  });

  return serializeUser(user);
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({
    where: {
      id
    }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const deletedUser = await prisma.user.update({
    where: {
      id
    },
    data: {
      isActive: false
    }
  });

  return serializeUser(deletedUser);
}

function enforceSelfOrAdmin(resourceUserId: string, actor: Actor) {
  if (actor.role !== Role.ADMIN && actor.id !== resourceUserId) {
    throw new HttpError(403, 'You can only access your own user profile');
  }
}
