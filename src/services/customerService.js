const User = require('../models/user');
const StatusError = require('../helpers/statusError');

module.exports = {
    addPurchase,
    updatePurchase,
    deletePurchase,
    getPurchases,
    businessFromPurchase,
    updateCustomer,
    updateCustomerProperties,
    addReward,
    deleteReward,
    addCampaignRewards,
    findCustomerData,
    updateRewards,
    useReward,
    listCustomers
};

/**
 * Find the user's customerData for the given business
 * @param {object|id} the user object or the id of the user
 * @param {id} businessId value of business's `_id` to query by
 */
async function findCustomerData(user, businessId) {
    if (!user.customerData) { // Does not exists so it's the user id
        user = await User.findById(user);
    }
    if (!user) {
        throw new StatusError(`Customer data of ${user._id} was not found`, 404)
    }
    const data = user.customerData.find(_item => _item.business.equals(businessId));
    return data;
}

/**
 * Get customerData AND other data that is available (e.g email, birthday)
 * @param user
 * @param businessId
 * @returns {Promise<{birthday, lastVisit, customerData: *, email, authentication: {service: {type: StringConstructor}}}>}
 */
async function getCustomerData(user, businessId) {
    if (!user.customerData) { // Does not exists so it's the user id
        user = await User.findById(user);
    }
    const customerData = await findCustomerData(user, businessId);
    const { _id, id, email, lastVisit, birthday, authentication } = user;
    return { _id, id, customerData, email, lastVisit, birthday, authentication: { service: authentication.service } }
}

/**
 * Update customerData object. Returns the new object.
 * @param {id} userId value of the user's `_id` to query by
 * @param {id} businessId value of business's `_id` to query by
 * @param {Object} updated the updates to perform. Values of this object are copied to current object
 */
async function updateCustomer(userId, businessId, updated) {
    const user = await User.findById(userId);
    const obj = await findCustomerData(user, businessId);
    const data = Object.assign(obj, updated);
    await user.save();
    return data;
}


/**
 * Update customerData's "properties" object. Returns the new properties object.
 * @param {id} userId value of the user's `_id` to query by
 * @param {id} businessId value of business's `_id` to query by
 * @param {Object} updateProperties the updates to perform. Values of this object are copied to current properties.
 */
async function updateCustomerProperties(userId, businessId, updateProperties) {
    return await updateCustomer(userId, businessId, { properties: updateProperties })
}

/**
 * Add a new purchase. The user's all purchases in the given business.
 * @param {ObjectId|string} userId value of the user's `_id` to query by
 * @param {ObjectId|string} businessId value of business's `_id` to query by
 * @param {object} purchase the new purchase
 */
async function addPurchase(userId, businessId, purchase) {
    const user = await User.findById(userId);
    let data = await findCustomerData(user, businessId);
    if (!data) {
        user.customerData.push({ business: businessId, purchases: [purchase] });
    } else {
        data.purchases.push(purchase);
    }
    await user.save();
    // return only this business's data
    const newData = await findCustomerData(user, businessId);
    return newData.purchases;
}

/**
 * Find the user of the given purchase
 * @param {any} purchaseId value of purchase's `_id` to query by
 */
async function userByPurchaseId(purchaseId) {
    const result = await User.findOne({ "customerData.purchases._id": purchaseId });
    return result;
}

/**
 * Find the business of the given purchase
 * @param {id} purchaseId value of purchase's `_id` to query by
 */
async function businessFromPurchase(purchaseId) {
    const user = await userByPurchaseId(purchaseId);
    if (!user) {
        return null;
    }
    return findCustomerDataFromPurchase(user, purchaseId).business;
}

/**
 * Finds one element from customerData that contains the given purchaseId
 * @param {object} user the user who owns the purchase
 * @param {id} purchaseId value of purchase's `_id` to query by
 */
async function findCustomerDataFromPurchase(user, purchaseId) {
    for (let i in user.customerData) {
        const data = user.customerData[i];
        if (data.purchases && data.purchases.findIndex(_p => _p._id.equals(purchaseId)) > -1) {
            return data;
        }
    }
}

/**
 * Update the given purchase. Throws an error if the purchase is not found.
 * Returns the users current purchases (with the updated purchase)
 * @param {id} userId the user's id
 * @param {id} purchaseId value of purchase's `_id` to query by
 * @param {object} purchase the updated version of the purchase
 */
async function updatePurchase(userId, purchaseId, purchase) {
    purchase._id = purchaseId;
    const user = await User.findById(userId);
    if (!user) {
        throw Error('User not found');
    }
    const customerData = await findCustomerDataFromPurchase(user, purchaseId);
    const newPurchases = customerData.purchases.map(obj => obj._id.equals(purchaseId) ? Object.assign(obj, purchase) : obj);
    if (newPurchases.length !== customerData.purchases.length) {
        user.customerData.purchases = newPurchases;
        await user.save();
    }
    return customerData.purchases;
}

/**
 * Delete the given purchases.
 * If the purchase doesn't exists in any user's purchases and error will be thrown.
 * Returns the list of purchases where the given purchase was (and is now removed)
 * @param {id} userId the user's id
 * @param {id} purchaseId value of purchase's `_id` to query by
 */
async function deletePurchase(userId, purchaseId) {
    const user = await User.findById(userId);
    if (!user) {
        throw Error('User not found');
    }
    const customerData = await findCustomerDataFromPurchase(user, purchaseId);
    const newPurchases = customerData.purchases.filter(purchase => purchase.id.toString() !== purchaseId);
    if (newPurchases.length !== customerData.purchases.length) {
        customerData.purchases = newPurchases;
        await user.save();
    }
    return customerData.purchases;
}

/**
 * Find all purchases by the given user in the given business. Returns a list of purchases
 * @param {id} id value of user's `_id` to query by
 * @param {business|id} business the business or its id
 */
async function getPurchases(id, business) {
    const user = await User.findById(id);
    return user.customerDataByBusiness(business).purchases;
}

/**
 * Add a new reward
 * @param userParam the id of the user or the user object, user to receive the reward
 * @param businessId the business giving the reward
 * @param reward the reward to give
 * @returns {Promise<[*]>} the user's updated customerData in the given business
 */
async function addReward(userParam, businessId, reward) {
    // For some reason userParam.id is always truthy???
    const user = userParam.save ? userParam : await User.findById(userParam);
    let data = await findCustomerData(user, businessId);
    if (!data) {
        // create customer data for this business
        user.customerData.push(data = { business: businessId, rewards: [reward] });
    } else {
        data.rewards.push(reward);
    }
    await user.save();
    return data.rewards;
}

async function useReward(user, customerData, reward) {
    customerData.rewards = customerData.rewards.filter(r => !r._id.equals(reward._id));
    customerData.usedRewards.push({ reward: reward });
    await user.save();
}

/**
 * A method to replace all rewards.
 * @param userId the id of the user
 * @param businessId the id of the business
 * @param newRewards the new rewards to save
 */
// TODO: test
async function updateRewards(userId, businessId, newRewards) {
    const user = await User.findById(userId);
    const customerData = await findCustomerData(user, businessId);
    customerData.rewards = newRewards;
    await user.save();
    return newRewards;
}

/**
 * Remove the reward (if given by the specified business) from the user's customer data
 * @param userId the user
 * @param businessId the business
 * @param rewardId the reward to remove
 */
async function deleteReward(userId, businessId, rewardId) {
    const user = await User.findById(userId);
    const customerData = await findCustomerData(user, businessId);
    const newRewards = customerData.rewards.filter(reward => reward.id.toString() !== rewardId);
    if (newRewards.length !== customerData.rewards.length) {
        customerData.rewards = newRewards;
        await user.save();
    }
    return newRewards;
}

/**
 * Add all rewards from the campaign.
 * Increases rewardedCount but does not perform any checks, (use #canReceiveCampaignRewards)
 * @param user the id of the user or the user object
 * @param campaign
 * @returns all given rewards (campaign.endReward)
 */
async function addCampaignRewards(user, campaign) {
    if (campaign.endReward && campaign.endReward.length) {
        campaign.endReward.forEach(reward => {
            reward.campaign = campaign.id;
            addReward(user, campaign.business, reward);
        });
        campaign.rewardedCount++;
        await campaign.save();
    }
    return campaign.endReward
}

async function listCustomers(businessId, limit, search) {
    let users = await User.find({ "customerData.business": businessId }).limit(search ? (limit || 100) : 500); // If searching limit at 500, might fix later
    if (search && search.trim().length) {
        // FIXME: bad
        users = users.filter(u => JSON.stringify(u).toLowerCase().includes(search));
    }
    return Promise.all(users.map(u => getCustomerData(u, businessId)));
}