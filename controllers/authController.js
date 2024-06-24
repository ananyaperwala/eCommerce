import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import userModel from "../models/userModel.js";
import JWT from "jsonwebtoken";

export const registerController = async (req, res) => {
    try {
        const { name, email, password, phone, address, answer } = req.body;

        // Validation
        if (!name) return res.status(400).send({ message: 'Name is required' });
        if (!email) return res.status(400).send({ message: 'Email is required' });
        if (!password) return res.status(400).send({ message: 'Password is required' });
        if (!phone) return res.status(400).send({ message: 'Phone is required' });
        if (!address) return res.status(400).send({ message: 'Address is required' });
        if (!answer) return res.status(400).send({ message: 'Answer is required' });

        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).send({
                success: false,
                message: 'User already registered. Please login.',
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Save user
        const user = await new userModel({ name, email, phone, address, password: hashedPassword, answer }).save();
        res.status(201).send({
            success: true,
            message: 'User registered successfully',
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: 'Error in registration',
            error
        });
    }
};

// POST LOGIN
export const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).send({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Check user
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).send({
                success: false,
                message: 'Email is not registered'
            });
        }

        // Compare passwords
        const match = await comparePassword(password, user.password);
        if (!match) {
            return res.status(401).send({
                success: false,
                message: 'Invalid password'
            });
        }

        // Generate token
        const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.status(200).send({
            success: true,
            message: 'Login successful',
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role, 
            },
            token,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: 'Error in login',
            error
        });
    }
};

// Forgot Password
export const forgotPasswordController = async (req, res) => {
    try {
        const { email, answer, newPassword } = req.body;

        // Validation
        if (!email) return res.status(400).send({ message: 'Email is required' });
        if (!answer) return res.status(400).send({ message: 'Answer is required' });
        if (!newPassword) return res.status(400).send({ message: 'New Password is required' });

        // Check user
        const user = await userModel.findOne({ email, answer });
        if (!user) {
            return res.status(404).send({
                success: false,
                message: 'Wrong email or answer'
            });
        }

        // Hash new password
        const hashed = await hashPassword(newPassword);
        await userModel.findByIdAndUpdate(user._id, { password: hashed });

        res.status(200).send({
            success: true,
            message: 'Password reset successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: 'Something went wrong',
            error
        });
    }
};

// Test Controller
export const testController = (req, res) => {
    try {
        res.send('Protected Route');
    } catch (error) {
        console.error(error);
        res.status(500).send({ error });
    }
};


//update profile controller 
export const updateProfileController =async (req, res)=>{
try{
const {name, email, password, address, phone} = req.body 
const user = await userModel.findById(req.user._id)
//password 
if(!password && password.length <6){
    return res.json({error:'Password is required and must be 6 characters long'})
}
const hashedPassword = password? await hashPassword(password):undefined; 
const updatedUser = await userModel.findByIdAndUpdate(req.user._id,{
    name:name || user.name , 
    password: password || user.password, 
    phone:phone || user.phone, 
    address: address || user.address, 
},{new :true})
res.status(200).send({
    success: true, 
    message: 'Profile Update successfully', 
    updatedUser
})
}catch(error){
console.log(error)
res.status(400).send({
    success: false, 
    message:'Error while updating information',
    error
})
}
}; 