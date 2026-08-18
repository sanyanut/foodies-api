import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import * as usersController from "../../src/modules/users/users.controller.ts";
import * as usersService from "../../src/modules/users/users.service.ts";

vi.mock("../../src/modules/users/users.service.ts", () => ({
  getMyProfile: vi.fn(),
  getFollowing: vi.fn(),
  updateAvatar: vi.fn(),
  getUserProfile: vi.fn(),
  getFollowers: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
}));

describe("Users Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { id: "current-user" },
      params: {},
      query: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
      locals: { query: {} },
    };
    next = vi.fn();
  });

  describe("getMyProfile", () => {
    it("should return profile and 200 status", async () => {
      const mockProfile = { id: "current-user", name: "Test" };
      // @ts-ignore
      vi.mocked(usersService.getMyProfile).mockResolvedValue(mockProfile);

      await usersController.getMyProfile(req as Request, res as Response, next);

      expect(usersService.getMyProfile).toHaveBeenCalledWith("current-user");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProfile);
    });

    it("should call next with error if service throws", async () => {
      const error = new Error("Test error");
      // @ts-ignore
      vi.mocked(usersService.getMyProfile).mockRejectedValue(error);

      await usersController.getMyProfile(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getFollowing", () => {
    it("should return paginated following users", async () => {
      res.locals = { query: { page: 1, limit: 5 } };
      const mockResult = { users: [], total: 0, page: 1, limit: 5, totalPages: 0 };
      // @ts-ignore
      vi.mocked(usersService.getFollowing).mockResolvedValue(mockResult);

      await usersController.getFollowing(req as Request, res as Response, next);

      expect(usersService.getFollowing).toHaveBeenCalledWith("current-user", 1, 5);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe("updateAvatar", () => {
    it("should return updated avatar url", async () => {
      req.file = { buffer: Buffer.from("test") } as Express.Multer.File;
      // @ts-ignore
      vi.mocked(usersService.updateAvatar).mockResolvedValue({ avatarUrl: "http://image.url" });

      await usersController.updateAvatar(req as Request, res as Response, next);

      expect(usersService.updateAvatar).toHaveBeenCalledWith("current-user", req.file);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ avatarUrl: "http://image.url" });
    });

    it("should throw 400 if file is missing", async () => {
      req.file = undefined;
      await usersController.updateAvatar(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Avatar file is required" });
      expect(usersService.updateAvatar).not.toHaveBeenCalled();
    });
  });

  describe("getUserProfile", () => {
    it("should return public profile", async () => {
      req.params = { id: "target-user" };
      const mockProfile = { id: "target-user", isFollowedByMe: true };
      // @ts-ignore
      vi.mocked(usersService.getUserProfile).mockResolvedValue(mockProfile);

      await usersController.getUserProfile(req as Request, res as Response, next);

      expect(usersService.getUserProfile).toHaveBeenCalledWith("current-user", "target-user");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProfile);
    });
  });

  describe("getFollowers", () => {
    it("should return followers", async () => {
      req.params = { id: "target-user" };
      res.locals = { query: { page: 2, limit: 10 } };
      const mockResult = { users: [], total: 0, page: 2, limit: 10, totalPages: 0 };
      // @ts-ignore
      vi.mocked(usersService.getFollowers).mockResolvedValue(mockResult);

      await usersController.getFollowers(req as Request, res as Response, next);

      expect(usersService.getFollowers).toHaveBeenCalledWith("current-user", "target-user", 2, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe("followUser", () => {
    it("should return 201 on success", async () => {
      req.params = { id: "target-user" };
      // @ts-ignore
      vi.mocked(usersService.followUser).mockResolvedValue(undefined);

      await usersController.followUser(req as Request, res as Response, next);

      expect(usersService.followUser).toHaveBeenCalledWith("current-user", "target-user");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: "Successfully followed" });
    });
  });

  describe("unfollowUser", () => {
    it("should return 204", async () => {
      req.params = { id: "target-user" };
      // @ts-ignore
      vi.mocked(usersService.unfollowUser).mockResolvedValue(undefined);

      await usersController.unfollowUser(req as Request, res as Response, next);

      expect(usersService.unfollowUser).toHaveBeenCalledWith("current-user", "target-user");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
