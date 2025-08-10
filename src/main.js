
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
    const discount = 1 - (purchase.discount / 100);
    return purchase.sale_price * purchase.quantity * discount;
}

function calculateBonusByProfit(index, total, seller) {
    if (index === 0) {
        return seller.profit * 0.15;
    } else if (index === 1 || index === 2) {
        return seller.profit * 0.10;
    } else if (index === total - 1) {
        return 0;
    }
    return seller.profit * 0.05;
}

function analyzeSalesData(data, options) {
    if (!data
        || !Array.isArray(data.sellers)
        || data.sellers.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    const { calculateRevenue, calculateBonus } = options;
    if (!calculateRevenue || !calculateBonus) {
        throw new Error('Чего-то не хватает');
    }

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {},
        top_products: [],
        bonus: 0,
    }));

    const sellersIndex = sellerStats.reduce((index, seller) => ({
        ...index,
            [seller.id]: seller
    }), {});
    const productsIndex = data.products.reduce((index, product) => ({
        ...index,
        [product.sku]: product
    }), {})

    data.purchase_records.forEach(record => {
        const seller = sellersIndex[record.seller_id];
        seller.sales_count++;
        seller.revenue += record.total_amount;

        record.items.forEach(item => {
            const product = productsIndex[item.sku];
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item);
            const profit = revenue - cost;
            seller.profit += profit;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        })
    });

    sellerStats.sort((a, b) => {
        return b.profit - a.profit;
    });

    sellerStats.forEach((seller, index) => {
       seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller);
       seller.top_products = Object.entries(seller.products_sold)
           .map(([sku, quantity]) => ({ sku, quantity }))
           .sort((a, b) => b.quantity-a.quantity)
           .slice(0, 10);
    });

    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}
