import { describe, it, expect, vi, beforeEach } from "vitest";
import * as usersService from "../../src/modules/users/users.service.ts";
import prisma from "../../src/prisma/prisma.ts";
import * as cloudinary from "../../src/common/cloudinary.ts";

// Mock Prisma
vi.mock("../../src/prisma/prisma.ts", () => {
  return {
    default: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      follow: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

// Mock Cloudinary
vi.mock("../../src/common/cloudinary.ts", () => ({
  uploadImageBuffer: vi.fn(),
}));

describe("Users Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMyProfile", () => {
    it("should return user profile with counters", async () => {
      const mockUser = {
        id: "u1",
        name: "Test",
        email: "test@test.com",
        avatar: null,
        _count: { recipes: 1, favorites: 2, followers: 3, following: 4 },
      };
      // @ts-ignore
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await usersService.getMyProfile("u1");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "u1" },
        select: expect.any(Object),
      });
      expect(result).toEqual({
        id: "u1",
        name: "Test",
        email: "test@test.com",
        avatar: null,
        recipesCount: 1,
        favoritesCount: 2,
        followersCount: 3,
        followingCount: 4,
      });
    });

    it("should throw 404 if user not found", async () => {
      // @ts-ignore
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(usersService.getMyProfile("u1")).rejects.toThrow("User not found");
    });
  });

  describe("getUserProfile", () => {
    it("should return public profile with isFollowedByMe", async () => {
      const mockUser = {
        id: "u2",
        name: "Test User 2",
        email: "test2@test.com",
        avatar: null,
        _count: { recipes: 1, followers: 2 },
      };
      // @ts-ignore
      prisma.user.findUnique.mockResolvedValue(mockUser);
      // @ts-ignore
      prisma.follow.findUnique.mockResolvedValue({ followerId: "u1", followingId: "u2" });

      const result = await usersService.getUserProfile("u1", "u2");

      expect(result.isFollowedByMe).toBe(true);
      expect(result.name).toBe("Test User 2");
      expect(result.recipesCount).toBe(1);
    });

    it("should throw 404 if target user not found", async () => {
      // @ts-ignore
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(usersService.getUserProfile("u1", "u2")).rejects.toThrow("User not found");
    });
  });

  describe("updateAvatar", () => {
    it("should upload image and update user", async () => {
      const mockFile = { buffer: Buffer.from("test") } as Express.Multer.File;
      // @ts-ignore
      vi.mocked(cloudinary.uploadImageBuffer).mockResolvedValue("http://image.url");

      const result = await usersService.updateAvatar("u1", mockFile);

      expect(cloudinary.uploadImageBuffer).toHaveBeenCalledWith(mockFile.buffer, "foodies/avatars");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { avatar: "http://image.url" },
      });
      expect(result.avatarUrl).toBe("http://image.url");
    });
  });

  describe("getFollowing", () => {
    it("should return paginated following list", async () => {
      const mockFollows = [{ following: { id: "u2", name: "User2" } }];
      // @ts-ignore
      prisma.$transaction.mockResolvedValue([mockFollows, 1]);

      const result = await usersService.getFollowing("u1", 1, 5);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.users).toEqual([{ id: "u2", name: "User2", isFollowedByMe: true }]);
      expect(result.total).toBe(1);
    });
  });

  describe("getFollowers", () => {
    it("should return paginated followers list", async () => {
      // @ts-ignore
      prisma.user.findUnique.mockResolvedValue({ id: "targetId" });
      const mockFollows = [{ follower: { id: "u3", name: "User3" } }];
      // @ts-ignore
      prisma.$transaction.mockResolvedValue([mockFollows, 1]);
      // @ts-ignore
      prisma.follow.findMany.mockResolvedValue([{ followingId: "u3" }]); // current user follows u3 back

      const result = await usersService.getFollowers("u1", "targetId", 1, 5);

      expect(result.users).toEqual([{ id: "u3", name: "User3", isFollowedByMe: true }]);
    });
  });

  describe("followUser", () => {
    it("should follow user if not already following", async () => {
      // @ts-ignore
      prisma.user.findUnique.mockResolvedValue({ id: "u2" }); // target exists
      // @ts-ignore
      prisma.follow.findUnique.mockResolvedValue(null); // not following yet

      await usersService.followUser("u1", "u2");

      expect(prisma.follow.create).toHaveBeenCalledWith({
        data: { followerId: "u1", followingId: "u2" },
      });
    });

    it("should throw 400 if trying to follow self", async () => {
      await expect(usersService.followUser("u1", "u1")).rejects.toThrow("You cannot follow yourself");
    });

    it("should throw 409 if already following", async () => {
      // @ts-ignore
      prisma.user.findUnique.mockResolvedValue({ id: "u2" }); 
      // @ts-ignore
      prisma.follow.findUnique.mockResolvedValue({ followerId: "u1", followingId: "u2" });

      await expect(usersService.followUser("u1", "u2")).rejects.toThrow("Already following this user");
    });
  });

  describe("unfollowUser", () => {
    it("should delete follow record", async () => {
      await usersService.unfollowUser("u1", "u2");
      expect(prisma.follow.delete).toHaveBeenCalledWith({
        where: { followerId_followingId: { followerId: "u1", followingId: "u2" } }
      });
    });

    it("should ignore P2025 error (record not found)", async () => {
      // @ts-ignore
      prisma.follow.delete.mockRejectedValue({ code: "P2025" });
      await expect(usersService.unfollowUser("u1", "u2")).resolves.not.toThrow();
    });

    it("should throw non-P2025 errors", async () => {
      // @ts-ignore
      prisma.follow.delete.mockRejectedValue(new Error("DB Connection Error"));
      await expect(usersService.unfollowUser("u1", "u2")).rejects.toThrow("DB Connection Error");
    });
  });
});
