import createHttpError from "http-errors";
import prisma from "../../prisma/prisma.ts";
import { uploadImageBuffer } from "../../common/cloudinary.ts";


// GET users/me
export async function getMyProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      _count: {
        select: {
          recipes: true, // recipesCount
          favorites: true, // favoritesCount
          followers: true, // followersCount
          following: true, // followingCount
        },
      },
    },
  });

  if (!user) throw createHttpError(404, "User not found");

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    recipesCount: user._count.recipes,
    favoritesCount: user._count.favorites,
    followersCount: user._count.followers,
    followingCount: user._count.following,
  };
}

// GET /users/:id
export async function getUserProfile(currentUserId: string, targetId: string) {
  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      _count: {
        select: {
          recipes: true, // recipesCount
          followers: true, // followersCount
        },
      },
    },
  });

  if (!user) throw createHttpError(404, "User not found");

  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetId,
      },
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    recipesCount: user._count.recipes,
    followersCount: user._count.followers,
    isFollowedByMe: follow !== null,
  };
}

// PATCH /users/me/avatar
export async function updateAvatar(userId: string, file: Express.Multer.File) {
  // upload to Cloudinary -> get a link
  const avatarUrl = await uploadImageBuffer(file.buffer, "foodies/avatars");

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: { avatar: avatarUrl },
  });

  return { avatarUrl };
}

// GET /users/me/following
export async function getFollowing(
  userId: string,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;

  const [follows, total] = await prisma.$transaction([
    prisma.follow.findMany({
      where: { followerId: userId },
      skip,
      take: limit,
      select: {
        following: {
          // following User
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  const users = follows.map((f) => ({
    ...f.following,
    isFollowedByMe: true, // static true
  }));

  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

//GET /users/:id/followers
export async function getFollowers(
  currentUserId: string,
  targetId: string,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw createHttpError(404, "User not found");

  const [follows, total] = await prisma.$transaction([
    prisma.follow.findMany({
      where: { followingId: targetId },
      skip,
      take: limit,
      select: {
        follower: {
          // follower
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    }),
    prisma.follow.count({ where: { followingId: targetId } }),
  ]);

  const myFollowing = await prisma.follow.findMany({
    where: { followerId: currentUserId },
    select: { followingId: true },
  });

  // Build a Set for O(1) lookups — much faster than Array.includes() which is O(n)
  // For 200 followers × 200 subscriptions: Set = 200 checks, Array = 40 000 checks
  const myFollowingSet = new Set(myFollowing.map((f) => f.followingId));

  const users = follows.map((f) => ({
    ...f.follower,
    isFollowedByMe: myFollowingSet.has(f.follower.id),
  }));

  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// POST /users/:id/follow
export async function followUser(currentUserId: string, targetId: string) {
  if (currentUserId === targetId)
    throw createHttpError(400, "You cannot follow yourself");

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw createHttpError(404, "User not found");

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetId,
      },
    },
  });
  if (existing) throw createHttpError(409, "Already following this user");

  await prisma.follow.create({
    data: {
      followerId: currentUserId,
      followingId: targetId,
    },
  });
}

// DELETE /users/:id/follow
export async function unfollowUser(currentUserId: string, targetId: string) {
  try {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetId,
        },
      },
    });
  } catch (err: unknown) {
    // P2025 = Record not found — idempotency ignore
    const isPrismaNotFound =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2025";

    if (!isPrismaNotFound) throw err;
  }
}

// GET /users/:id/recipes
export async function getUserRecipes(
  userId: string,
  page: number,
  limit: number,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const skip = (page - 1) * limit;

  const [recipes, total] = await prisma.$transaction([
    prisma.recipe.findMany({
      where: { ownerId: userId },
      skip,
      take: limit,
      include: {
        category: {
          select: { id: true, name: true },
        },
        area: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.recipe.count({
      where: { ownerId: userId },
    }),
  ]);

  return {
    data: recipes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}