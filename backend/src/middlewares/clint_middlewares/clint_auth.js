import jwt from "jsonwebtoken";
import { Client } from "../../models/client_models.js";


export const clint_auth = async (req, res, next) => {
    try {
        const token = req.cookies?.clinttoken;

        if (!token) {
            return res.status(401).json({ message: "Authentication required. No token provided", status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ message: "Invalid token", status: 401 });
        }

        const userId = decoded.id; // Changed from decoded._id to decoded.id

        if (!userId) {
            return res.status(401).json({ message: "User ID not found in token", status: 401 });
        }

        const client = await Client.findById(userId).select("-password");

        if (!client) {
            return res.status(401).json({ message: "Client not found", status: 401 });
        }

        req.clint = client;
        next();

    } catch (error) {
        console.log("Error in client auth middleware:", error);
        return res.status(401).json({ message: "Authentication failed", status: 401 });
    }
}

export const validClient = async (req, res, next) => {
    try {
        const token = req.cookies?.clinttoken;

        if (!token) {
            return res.status(200).json({ message: "invalid user no token provied", status: 202 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(400).json({ message: "error during decoded token" });
        }

        const userid = decoded.id; // Changed from decoded._id to decoded.id

        if (!userid) {
            return res.status(400).json({ message: "user id not found" });
        }

        const finduser = await Client.findById(userid).select("-password");

        if (!finduser) {
            return res.status(202).json({ message: "in valid user", status: 202 });
        }

        req.user = finduser;

        next();

    } catch (error) {
        console.log("error in manager middleware ", error)
    }

}
