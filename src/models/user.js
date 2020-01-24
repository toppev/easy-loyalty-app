const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const purchaseSchema = new Schema({
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
    }
    // Might add these back later(?)
    // With current plan it won't be easy to get the exact product
    /*
    products: [{
        type: Schema.Types.ObjectId,
        ref: 'Product'
    }],
    price: {
        type: mongoose.Decimal128,
        validate: {
            validator: function (v) { return v >= 0; },
            message: '{VALUE} is negative'
        }
    },
    */
});

const userSchema = new Schema({
    email: {
        type: String,
        // 
        validate: {
            validator: async function (value) {
                // Allow undefined
                if (!value) {
                    return true;
                }
                return await User.find({ email: value });
            }, message: 'Email is already taken.',
        },
        index: true
    },
    password: {
        type: String,
    },
    lastVisit: {
        type: Date,
        default: Date.now
    },
    birthday: {
        type: Date
    },
    authentication: {
        // The service used
        service: {
            type: String,
        },
        profile: {
            type: Object,
        }
    },
    customerData: [{
        business: {
            type: Schema.Types.ObjectId,
            ref: 'Business'
        },
        role: {
            type: String,
            // only user or business
            // enum: Object.keys(role.roles),
            enum: ['user', 'business'],
            default: 'user'
        },
        purchases: [purchaseSchema],
        points: {
            type: Number,
            default: 0
        }
    }],
});

purchaseSchema.methods.populateProducts = function () {
    return this.populate('Product');
};

userSchema.methods.customerDataByBusiness = async function (business) {
    const id = business.id || business;
    return this.customerData.find(data => data.business == id);
};

/**
 * Check whether user can perform the specified operation.
 */
userSchema.methods.hasPermission = async function (operation, params) {
    // If not set use 'user' role
    let userRole = 'user';
    let businessId;
    if (params.reqParams && params.reqParams.businessId) {
        const data = await this.customerDataByBusiness(params.reqParams.businessId);
        if (data) {
            businessId = data.business;
            userRole = data.role;
        }
    }
    const result = await role.can(userRole, operation, { businessId, ...params })
        .catch(err => { throw err; });
    return result;
};

userSchema.pre('save', async function (next) {
    // only hash if modified (or new)
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});

userSchema.methods.comparePassword = function (password) {
    return password && bcrypt.compareSync(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

// Because circular dependencies
var role = require('./role');