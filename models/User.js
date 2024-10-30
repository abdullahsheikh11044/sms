import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    role: { type: String, enum: ['principal', 'teacher', 'student'], required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    isInvited: {type: Boolean, default: false},
    invitationToken: {type: String},
    invitationExpires: {type: Date},
});

const User = mongoose.model('User', UserSchema);
export default User;
