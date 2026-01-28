const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a community name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // We can cache these or calculate them on the fly. 
    // For scalability, caching is better, updated via hooks or scheduled jobs.
    // For now, let's keep it simple and calculate on read or update on submission.
    stats: {
        totalPollutionSaved: {
            type: Number,
            default: 0
        },
        totalTreesPlanted: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual populate for members specific fields if needed
// communitySchema.virtual('memberCount').get(function() {
//   return this.members.length;
// });

module.exports = mongoose.model('Community', communitySchema);
