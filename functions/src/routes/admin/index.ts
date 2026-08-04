import { Router } from "express";
import codesRouter from "./codes";
import studentsRouter from "./students";
import coursesRouter from "./courses";

/**
 * Admin router — mounts all /admin/* sub-routes.
 * All sub-routers apply verifyToken + verifyAdmin internally.
 */
const router = Router();

router.use("/codes", codesRouter);
router.use("/students", studentsRouter);
router.use("/courses", coursesRouter);

export default router;
