/**
 * src/lib/stores/filterStore.js
 * 
 * Svelte 5 stores untuk Filter Monitoring.
 * Data bersumber dari MySQL via SvelteKit API Routes.
 * Initial data di-seed dari +layout.server.js (SSR).
 */
import { writable, derived } from 'svelte/store';

// ============================================================
// Records Store — writable, bisa di-update dari komponen
// ============================================================
function createRecordStore() {
    const { subscribe, set, update } = writable([]);

    return {
        subscribe,

        /** Seed initial data dari SSR (dipanggil dari +layout.svelte) */
        init(records) {
            set(records);
        },

        /** Refresh semua data dari API MySQL */
        async refresh(filters = {}) {
            try {
                const params = new URLSearchParams();
                if (filters.group  && filters.group  !== 'ALL') params.set('group',  filters.group);
                if (filters.search && filters.search !== '')    params.set('search', filters.search);
                if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);

                const res  = await fetch(`/api/records?${params.toString()}`);
                const data = await res.json();

                if (res.ok && Array.isArray(data)) {
                    set(data);
                }
                return data;
            } catch (err) {
                console.error('[filterStore.refresh]', err);
            }
        },

        /**
         * Catat servis/maintenance — PATCH /api/records/[id]
         * Foto diupload terpisah via FormData ke /api/photos
         */
        async recordService(id, serviceDate, intervalMonths, notes, photoFile, equipment = null) {
            try {
                let photoFilepath = null;
                let photoFilename = null;
                let photoId       = null;

                // 1. Upload foto dulu jika ada
                if (photoFile && photoFile instanceof File) {
                    const fd = new FormData();
                    fd.append('tank_id',    String(id));
                    fd.append('taken_date', serviceDate);
                    fd.append('caption',    notes || 'Dokumentasi Maintenance Filter');
                    fd.append('uploader',   'Teknisi Field');
                    fd.append('photo',      photoFile);

                    const uploadRes = await fetch('/api/photos', {
                        method: 'POST',
                        body:   fd
                    });

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        photoFilepath = uploadData.filepath;
                        photoFilename = uploadData.filename;
                        photoId       = uploadData.photo_id;
                    }
                }

                // 2. Update maintenance record di MySQL
                const patchRes = await fetch(`/api/records/${id}`, {
                    method:  'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        service_date:     serviceDate,
                        interval_months:  intervalMonths,
                        notes:            notes,
                        equipment:        equipment,
                        photo_id:         photoId,
                        photo_filepath:   photoFilepath,
                        photo_filename:   photoFilename,
                        photo_caption:    notes
                    })
                });

                if (patchRes.ok) {
                    const result = await patchRes.json();
                    
                    // Refresh photo directory & records
                    await photoDirectoryStore.refresh();
                    await this.refresh();

                    return result;
                }
            } catch (err) {
                console.error('[filterStore.recordService]', err);
            }
        },

        /**
         * Tambah tangki baru — POST /api/records + upload foto pemasangan awal jika ada
         */
        async addTank(newTank, photoFile = null) {
            try {
                const res = await fetch('/api/records', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newTank)
                });

                if (res.ok) {
                    const newRecord = await res.json();

                    // Upload foto pemasangan awal jika ada
                    if (photoFile && photoFile instanceof File) {
                        try {
                            const fd = new FormData();
                            fd.append('tank_id',    String(newRecord.id));
                            if (newRecord.maintenance_id) {
                                fd.append('maintenance_id', String(newRecord.maintenance_id));
                            }
                            fd.append('taken_date', newTank.install_date || new Date().toISOString().split('T')[0]);
                            fd.append('caption',    `Foto Pemasangan Awal Tangki & Filter ${newTank.equipment || 'MicroClean'} di ${newTank.estate}`);
                            fd.append('uploader',   newTank.pic_manager || 'Teknisi Lapangan');
                            fd.append('photo',      photoFile);

                            await fetch('/api/photos', {
                                method: 'POST',
                                body:   fd
                            });
                        } catch (photoErr) {
                            console.warn('[addTank photo upload error]', photoErr);
                        }
                    }

                    await photoDirectoryStore.refresh();
                    await this.refresh();

                    return newRecord;
                }
            } catch (err) {
                console.error('[filterStore.addTank]', err);
            }
        },

        /**
         * Ambil data detail lengkap 1 tangki (termasuk riwayat kronologi & foto)
         */
        async getTankDetail(id) {
            try {
                const res = await fetch(`/api/records/${id}`);
                if (res.ok) {
                    return await res.json();
                }
            } catch (err) {
                console.error('[filterStore.getTankDetail]', err);
            }
            return null;
        },

        /**
         * Hapus 1 unit tangki secara permanen — DELETE /api/records/[id]
         */
        async deleteTank(id) {
            try {
                const res = await fetch(`/api/records/${id}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    update(records => records.filter(r => r.id !== id && r.id !== parseInt(id)));
                    await photoDirectoryStore.refresh();
                    return { success: true };
                } else {
                    const err = await res.json();
                    return { success: false, error: err.error || 'Gagal menghapus tangki' };
                }
            } catch (err) {
                console.error('[filterStore.deleteTank]', err);
                return { success: false, error: err.message };
            }
        },

        /**
         * Non-aktifkan unit tangki jika tidak digunakan lagi — PATCH /api/records/[id]
         */
        async deactivateTank(id, status = 'NON-AKTIF') {
            try {
                const res = await fetch(`/api/records/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status_mc: status })
                });
                if (res.ok) {
                    await this.refresh();
                    return { success: true };
                }
            } catch (err) {
                console.error('[filterStore.deactivateTank]', err);
                return { success: false, error: err.message };
            }
        },

        /**
         * Aktifkan kembali unit tangki — PATCH /api/records/[id]
         */
        async activateTank(id) {
            try {
                const res = await fetch(`/api/records/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status_mc: 'AKTIF' })
                });
                if (res.ok) {
                    await this.refresh();
                    return { success: true };
                } else {
                    const err = await res.json();
                    return { success: false, error: err.error || 'Gagal mengaktifkan unit' };
                }
            } catch (err) {
                console.error('[filterStore.activateTank]', err);
                return { success: false, error: err.message };
            }
        }
    };
}

export const recordsStore = createRecordStore();

// ============================================================
// Stats Store — derived dari recordsStore
// ============================================================
export const statsStore = derived(recordsStore, $records => {
    const stats = {
        total:       $records.length,
        aman:        0,
        notice:      0,
        jatuh_tempo: 0,
        non_aktif:   0,
        groups:      {}
    };

    $records.forEach(r => {
        if (r.computed_status === 'AMAN')       stats.aman++;
        if (r.computed_status === 'NOTICE')      stats.notice++;
        if (r.computed_status === 'JATUH TEMPO') stats.jatuh_tempo++;
        if (r.computed_status === 'NON-AKTIF')   stats.non_aktif++;

        const g = r.group || 'Lainnya';
        if (!stats.groups[g]) stats.groups[g] = { total: 0, noticeCount: 0 };
        stats.groups[g].total++;
        if (r.computed_status === 'NOTICE' || r.computed_status === 'JATUH TEMPO') {
            stats.groups[g].noticeCount++;
        }
    });

    return stats;
});

// ============================================================
// Photo Directory Store — writable, di-seed dari layout SSR
// ============================================================
function createPhotoDirectoryStore() {
    const { subscribe, set, update } = writable({ tree: {}, totalPhotos: 0 });

    return {
        subscribe,

        /** Seed photos dari SSR atau refresh dari API */
        init(photos) {
            set(buildPhotoTree(photos));
        },

        /** Refresh foto dari API (bisa filter by group/region/estate) */
        async refresh(filters = {}) {
            try {
                const params = new URLSearchParams();
                if (filters.group  && filters.group  !== 'ALL') params.set('group',  filters.group);
                if (filters.region && filters.region !== 'ALL') params.set('region', filters.region);
                if (filters.estate && filters.estate !== 'ALL') params.set('estate', filters.estate);

                const res  = await fetch(`/api/photos?${params.toString()}`);
                const data = await res.json();

                if (res.ok && Array.isArray(data)) {
                    set(buildPhotoTree(data));
                }
            } catch (err) {
                console.error('[photoDirectoryStore.refresh]', err);
            }
        },

        /** Tambah 1 foto baru ke store tanpa reload penuh */
        addPhoto(photo) {
            update(state => {
                const newTree = { ...state.tree };
                const g  = photo.group         || 'Lainnya';
                const r  = photo.region        || 'Umum';
                const e  = photo.estate        || 'Unassigned';
                const lt = photo.location_type || 'Kebun';

                if (!newTree[g]) newTree[g] = {};
                if (!newTree[g][r]) newTree[g][r] = {};
                if (!newTree[g][r][e]) newTree[g][r][e] = {};
                if (!newTree[g][r][e][lt]) newTree[g][r][e][lt] = [];

                newTree[g][r][e][lt].unshift(photo);
                return { tree: newTree, totalPhotos: state.totalPhotos + 1 };
            });
        },

        /** Hapus foto berdasarkan ID atau Filepath */
        async deletePhoto(id, filepath = '') {
            try {
                const params = new URLSearchParams();
                if (filepath) params.set('filepath', filepath);

                const res = await fetch(`/api/photos/${id}?${params.toString()}`, { method: 'DELETE' });
                if (res.ok) {
                    await this.refresh();
                    await recordsStore.refresh();
                    return true;
                }
            } catch (err) {
                console.error('[photoDirectoryStore.deletePhoto]', err);
            }
            return false;
        }
    };
}

export const photoDirectoryStore = createPhotoDirectoryStore();

// ============================================================
// Groups Store — writable, kelola master Group Perusahaan
// ============================================================
function createGroupsStore() {
    const { subscribe, set, update } = writable([]);

    return {
        subscribe,

        init(groups) {
            set(groups);
        },

        async refresh() {
            try {
                const res = await fetch('/api/groups');
                if (res.ok) {
                    const data = await res.json();
                    set(data);
                    return data;
                }
            } catch (err) {
                console.error('[groupsStore.refresh]', err);
            }
        },

        async addGroup(groupData) {
            try {
                const res = await fetch('/api/groups', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(groupData)
                });
                if (res.ok) {
                    const newGroup = await res.json();
                    await this.refresh();
                    return { success: true, group: newGroup };
                } else {
                    const err = await res.json();
                    return { success: false, error: err.error || 'Gagal menambah group' };
                }
            } catch (err) {
                console.error('[groupsStore.addGroup]', err);
                return { success: false, error: err.message };
            }
        },

        async editGroup(id, oldName, groupData) {
            try {
                const res = await fetch(`/api/groups/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...groupData, old_name: oldName })
                });
                if (res.ok) {
                    await this.refresh();
                    await recordsStore.refresh();
                    return { success: true };
                } else {
                    const err = await res.json();
                    return { success: false, error: err.error || 'Gagal mengubah group' };
                }
            } catch (err) {
                console.error('[groupsStore.editGroup]', err);
                return { success: false, error: err.message };
            }
        },

        async deleteGroup(id, groupName, deleteTanks = false) {
            try {
                const params = new URLSearchParams();
                if (groupName) params.set('name', groupName);
                if (deleteTanks) params.set('deleteTanks', 'true');

                const res = await fetch(`/api/groups/${id}?${params.toString()}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    await this.refresh();
                    await recordsStore.refresh();
                    return { success: true };
                } else {
                    const err = await res.json();
                    return { success: false, error: err.error || 'Gagal menghapus group' };
                }
            } catch (err) {
                console.error('[groupsStore.deleteGroup]', err);
                return { success: false, error: err.message };
            }
        }
    };
}

export const groupsStore = createGroupsStore();

// ============================================================
// Filter Stock Store — kelola stok tipe elemen filter
// ============================================================
function createFilterStockStore() {
    const { subscribe, set, update } = writable([]);

    return {
        subscribe,

        init(items) {
            set(Array.isArray(items) ? items : []);
        },

        async refresh() {
            try {
                const res = await fetch('/api/stock');
                if (res.ok) {
                    const data = await res.json();
                    set(data);
                    return data;
                }
            } catch (err) {
                console.error('[filterStockStore.refresh]', err);
            }
        },

        async addItem(itemData) {
            try {
                const res = await fetch('/api/stock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(itemData)
                });
                const data = await res.json();
                if (res.ok) {
                    update(items => [...items, data].sort((a, b) => a.filter_name.localeCompare(b.filter_name)));
                    return { success: true, item: data };
                }
                return { success: false, error: data.error || 'Gagal menambah tipe filter' };
            } catch (err) {
                return { success: false, error: err.message };
            }
        },

        async editItem(id, itemData) {
            try {
                const res = await fetch(`/api/stock/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(itemData)
                });
                const data = await res.json();
                if (res.ok) {
                    update(items => items.map(i => i.id === id ? data : i));
                    return { success: true, item: data };
                }
                return { success: false, error: data.error || 'Gagal mengubah tipe filter' };
            } catch (err) {
                return { success: false, error: err.message };
            }
        },

        /** Tambah atau kurangi stok: delta = +N atau -N */
        async adjustQuantity(id, delta) {
            try {
                const res = await fetch(`/api/stock/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ delta })
                });
                const data = await res.json();
                if (res.ok) {
                    update(items => items.map(i => i.id === id ? data : i));
                    return { success: true, item: data };
                }
                return { success: false, error: data.error };
            } catch (err) {
                return { success: false, error: err.message };
            }
        },

        async deleteItem(id) {
            try {
                const res = await fetch(`/api/stock/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (res.ok) {
                    update(items => items.filter(i => i.id !== id));
                    return { success: true };
                }
                return { success: false, error: data.error || 'Gagal menghapus' };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }
    };
}

export const filterStockStore = createFilterStockStore();

// Derived: stok filter telah dinonaktifkan, selalu return 0
export const stockAlertStore = derived(filterStockStore, $stock => ({
    menipis: 0,
    habis:   0,
    items_habis:   [],
    items_menipis: [],
}));

// ============================================================
// Helper: build photo tree structure
// ============================================================
function buildPhotoTree(photos) {
    const tree = {};
    let total = 0;

    photos.forEach(p => {
        const g  = p.group         || 'Lainnya';
        const r  = p.region        || 'Umum';
        const e  = p.estate        || 'Unassigned';
        const lt = p.location_type || 'Kebun';

        if (!tree[g]) tree[g] = {};
        if (!tree[g][r]) tree[g][r] = {};
        if (!tree[g][r][e]) tree[g][r][e] = {};
        if (!tree[g][r][e][lt]) tree[g][r][e][lt] = [];

        tree[g][r][e][lt].push(p);
        total++;
    });

    return { tree, totalPhotos: total };
}

// ============================================================
// Re-export computeStatus helper untuk keperluan frontend
// (digunakan jika ada kebutuhan hitung status di client)
// ============================================================
export function computeStatus(rec) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let status = 'AMAN';
    let daysLeft = null;

    const statusMcUpper = (rec.status_mc || '').toUpperCase();
    if (
        statusMcUpper.includes('TIDAK ADA') ||
        statusMcUpper.includes('TIDAK AKTIF') ||
        statusMcUpper.includes('PECAH') ||
        statusMcUpper.includes('NON')
    ) {
        status = 'NON-AKTIF';
    } else if (rec.next_maintenance) {
        const nextDt = new Date(rec.next_maintenance);
        nextDt.setHours(0, 0, 0, 0);
        const diffTime = nextDt.getTime() - today.getTime();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const intervalNum = parseInt(rec.interval_days || rec.interval_months) || 90;
        const noticeThreshold = intervalNum <= 14 ? Math.max(1, Math.floor(intervalNum * 0.25)) : 10;

        if (daysLeft <= 0) {
            status = 'JATUH TEMPO';
        } else if (daysLeft <= noticeThreshold) {
            status = 'NOTICE';
        } else {
            status = 'AMAN';
        }
    }

    return { ...rec, computed_status: status, days_left: daysLeft };
}
