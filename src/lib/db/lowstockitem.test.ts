import { inventoryApi } from "./db.api";

// prevent Jest from crashing when it sees '\
// import.meta.env' which only Vite understands
jest.mock("./index", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from "./index";
const mockedSupabase = supabase as jest.Mocked<typeof supabase>;

const mockOrder = jest.fn();
const mockEq = jest.fn(() => ({ order: mockOrder }));
const mockLte = jest.fn(() => ({ eq: mockEq }));
const mockSelect = jest.fn(() => ({ lte: mockLte }));

describe('Low Stock Items Detection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockOrder.mockClear();
        mockEq.mockClear();
        mockLte.mockClear();
        mockSelect.mockClear();
        (mockedSupabase.from as jest.Mock).mockClear();
    });

    it('should detect low stock items correctly', async () => {
        const mockItems = [
            {
                lot_id: "LOT1",
                item_qty: 5,
                unit_price: 10.0,
                expiry_date: "2025-12-31",
                is_deleted: false,
                items: { name: "Item A" }
            },
            {
                lot_id: "LOT2",
                item_qty: 8,
                unit_price: 12.5,
                expiry_date: "2026-01-15",
                is_deleted: false,
                items: { name: "Item B" }
            }
        ];

        (mockedSupabase.from as jest.Mock).mockReturnValue({
            select: mockSelect,
        });
        mockOrder.mockResolvedValueOnce({
            data: mockItems,
            error: null,
        });

        const lowStockItems = await inventoryApi.getLowStockItems(10);
        expect(lowStockItems).toEqual(mockItems);
        expect(lowStockItems[0].item_qty).toBeLessThanOrEqual(10);
        expect(lowStockItems[1].item_qty).toBeLessThanOrEqual(10);

        expect(lowStockItems[0].items.name).toBe("Item A");
        expect(lowStockItems[1].items.name).toBe("Item B");

    });




});
