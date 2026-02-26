const config = require('../config');
const { RateLimiter } = require("limiter");
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const baserowAPI = axios.create({
    baseURL: config.baserowApiUrl,
    headers: {
        'Authorization': `Token ${config.baserowApiToken}`,
        'Content-Type': 'application/json'
    }
});

const limiter = new RateLimiter({ tokensPerInterval: 45, interval: "minute" });

let db = {};

async function connect(){
    // Connection is handled by axios instance
    return true;
};

async function check_Profile(name){
    await limiter.removeTokens(4);
    try {
        const response = await baserowAPI.get(`/api/database/rows/table/${config.baserowTableId}/?search=${encodeURIComponent(name)}`);
        const rows = response.data.results;
        for (let i = 0; i < rows.length; i++){
            if (rows[i].name == name){
                return true;
            };
        };
        return false;
    } catch (error) {
        console.error('Error checking profile:', error);
        return false;
    }
};

async function update_Profile(name, data){
    await limiter.removeTokens(5);
    try {
        let check = await check_Profile(name);
        if (check == false) {
            await baserowAPI.post(`/api/database/rows/table/${config.baserowTableId}/`, data);
        } else {
            const response = await baserowAPI.get(`/api/database/rows/table/${config.baserowTableId}/?search=${encodeURIComponent(name)}`);
            const rows = response.data.results;
            let rowId = null;
            for (let i = 0; i < rows.length; i++){
                if (rows[i].name == name) {
                    rowId = rows[i].id;
                    break;
                }
            }
            if (rowId) {
                await baserowAPI.patch(`/api/database/rows/table/${config.baserowTableId}/${rowId}/`, data);
            }
        }
    } catch (error) {
        console.error('Error updating profile:', error);
    }
};

async function get_Profile(name){
    await limiter.removeTokens(4);
    try {
        const response = await baserowAPI.get(`/api/database/rows/table/${config.baserowTableId}/?search=${encodeURIComponent(name)}`);
        const rows = response.data.results;
        for (let i = 0; i < rows.length; i++){
            if (rows[i].name == name) {
                return {
                    id: rows[i].id,
                    data: rows[i],
                    get: function(field) { return this.data[field]; },
                    assign: async function(newData) { 
                        Object.assign(this.data, newData);
                    },
                    save: async function() {
                        await baserowAPI.patch(`/api/database/rows/table/${config.baserowTableId}/${this.id}/`, this.data);
                    },
                    delete: async function() {
                        await baserowAPI.delete(`/api/database/rows/table/${config.baserowTableId}/${this.id}/`);
                    }
                };
            }
        }
        return false;
    } catch (error) {
        console.error('Error getting profile:', error);
        return false;
    }
};

let open_Profile = async function(name){
    await limiter.removeTokens(4);
    let profile = await get_Profile(name);
    if (profile) {
        await profile.assign({open: 1});
        await profile.save();
    }
};

let close_Profile = async function(name){
    await limiter.removeTokens(3);
    let profile = await get_Profile(name);
    if (profile) {
        await profile.assign({open: ' '});
        await profile.save();
    }
};

async function delete_Profile(name){
    await limiter.removeTokens(2);
    let row = await get_Profile(name);
    if (row)
        await row.delete();
};

let get_Profiles = async function(){
    await limiter.removeTokens(2);
    try {
        const response = await baserowAPI.get(`/api/database/rows/table/${config.baserowTableId}/`);
        let arr = [];
        const rows = response.data.results;
        rows.forEach(row => {
            arr.push(row.name);
        });
        return arr;
    } catch (error) {
        console.error('Error getting profiles:', error);
        return [];
    }
};

async function get_Selected(){
    await limiter.removeTokens(3);
    try {
        const response = await baserowAPI.get(`/api/database/rows/table/${config.baserowTableId}/`);
        let res = [];
        const rows = response.data.results;
        for (let i = 0; i < rows.length; i++){
            if (rows[i].select == 'X'){
                let name = rows[i].name;
                res.push(name);
            }
        }
        return res;
    } catch (error) {
        console.error('Error getting selected profiles:', error);
        return [];
    }
};

function get_Engines(){
    const parentDir = path.resolve(__dirname, '..');
    const engines = fs.readdirSync(parentDir + '/engines');
    return engines;
};

module.exports.update_Profile = update_Profile;
module.exports.check_Profile = check_Profile;
module.exports.get_Profile = get_Profile;
module.exports.open_Profile = open_Profile;
module.exports.close_Profile = close_Profile;
module.exports.delete_Profile = delete_Profile;
module.exports.get_Selected = get_Selected;
// module.exports.add_Tag = add_Tag;
// module.exports.delete_Tag = delete_Tag;
module.exports.get_Profiles = get_Profiles;
module.exports.get_Engines = get_Engines;