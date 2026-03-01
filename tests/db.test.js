const axios = require('axios');
jest.mock('axios');

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

axios.create.mockReturnValue({
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete
});

// require db after mock
const db = require('../scr/db');
const config = require('../config');

describe('Database (Baserow Migration)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('get_Profiles returns an array of names', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                results: [
                    { name: 'profile1' },
                    { name: 'profile2' }
                ]
            }
        });

        const profiles = await db.get_Profiles();
        expect(profiles).toEqual(['profile1', 'profile2']);
        expect(mockGet).toHaveBeenCalledWith(`/api/database/rows/table/${config.baserowTableId}/?user_field_names=true`);
    });

    test('get_Selected returns selected profiles', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                results: [
                    { name: 'profile1', select: 'X' },
                    { name: 'profile2', select: ' ' },
                    { name: 'profile3', select: 'X' }
                ]
            }
        });

        const selected = await db.get_Selected();
        expect(selected).toEqual(['profile1', 'profile3']);
        expect(mockGet).toHaveBeenCalledWith(`/api/database/rows/table/${config.baserowTableId}/?user_field_names=true`);
    });

    test('check_Profile returns true if profile exists, false otherwise', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                results: [
                    { name: 'test_profile' }
                ]
            }
        });

        const exists = await db.check_Profile('test_profile');
        expect(exists).toBe(true);

        mockGet.mockResolvedValueOnce({
            data: {
                results: []
            }
        });

        const notExists = await db.check_Profile('non_existent');
        expect(notExists).toBe(false);
    });

    test('get_Profile returns an object with expected properties and methods', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                results: [
                    { id: 42, name: 'test_profile', proxy: '127.0.0.1:8080' }
                ]
            }
        });

        const profile = await db.get_Profile('test_profile');
        expect(profile).toBeDefined();
        expect(profile.id).toBe(42);

        // Test .get()
        expect(profile.get('name')).toBe('test_profile');
        expect(profile.get('proxy')).toBe('127.0.0.1:8080');

        // Test .assign() and .save()
        await profile.assign({ proxy: 'new_proxy' });
        expect(profile.get('proxy')).toBe('new_proxy');

        await profile.save();
        expect(mockPatch).toHaveBeenCalledWith(`/api/database/rows/table/${config.baserowTableId}/42/?user_field_names=true`, profile.data);

        // Test .delete()
        await profile.delete();
        expect(mockDelete).toHaveBeenCalledWith(`/api/database/rows/table/${config.baserowTableId}/42/`);
    });

    test('update_Profile posts new row if it does not exist', async () => {
        // mock for check_Profile
        mockGet.mockResolvedValueOnce({ data: { results: [] } });

        await db.update_Profile('new_profile', { name: 'new_profile', select: ' ' });

        expect(mockPost).toHaveBeenCalledWith(`/api/database/rows/table/${config.baserowTableId}/?user_field_names=true`, { name: 'new_profile', select: ' ' });
    });

    test('update_Profile patches existing row if it exists', async () => {
        // mock for check_Profile
        mockGet.mockResolvedValueOnce({ data: { results: [{ id: 99, name: 'existing_profile' }] } });
        // mock for getting row inside update_Profile
        mockGet.mockResolvedValueOnce({ data: { results: [{ id: 99, name: 'existing_profile' }] } });

        await db.update_Profile('existing_profile', { name: 'existing_profile', proxy: 'test' });

        expect(mockPatch).toHaveBeenCalledWith(`/api/database/rows/table/${config.baserowTableId}/99/?user_field_names=true`, { name: 'existing_profile', proxy: 'test' });
    });
});