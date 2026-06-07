import { useState, useEffect } from 'react';

export interface SaleDataPoint {
  time: string;
  sales: number;
}

export interface LatestPayment {
  id: string;
  amount: number;
  product: string;
  customer: string;
  time: string;
}

export function useRealtimeSalesData() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [averageSale, setAverageSale] = useState(0);
  const [salesChartData, setSalesChartData] = useState<SaleDataPoint[]>([]);
  const [cumulativeRevenueData, setCumulativeRevenueData] = useState<SaleDataPoint[]>([]);
  const [latestPayments, setLatestPayments] = useState<LatestPayment[]>([]);

  useEffect(() => {
    // Initial data
    const initialData: SaleDataPoint[] = [];
    const now = new Date();
    for (let i = 20; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5000);
      initialData.push({
        time: time.toLocaleTimeString([], { hour12: false }),
        sales: 0
      });
    }
    setSalesChartData(initialData);
    setCumulativeRevenueData(initialData);

    const interval = setInterval(() => {
      const currentTime = new Date();
      const timeStr = currentTime.toLocaleTimeString([], { hour12: false });
      
      // Randomly determine if a sale happened (50% chance)
      const hasSale = Math.random() > 0.5;
      const saleAmount = hasSale ? Math.floor(Math.random() * 500) + 10 : 0;

      if (hasSale) {
        setTotalRevenue(prev => prev + saleAmount);
        setSalesCount(prev => prev + 1);
        
        const newPayment: LatestPayment = {
          id: Math.random().toString(36).substr(2, 9),
          amount: saleAmount,
          product: ['Standard Plan', 'Pro Plan', 'Enterprise Kit', 'Custom License'][Math.floor(Math.random() * 4)],
          customer: ['Alice W.', 'Bob R.', 'Charlie M.', 'Diana L.', 'Erik S.'][Math.floor(Math.random() * 5)],
          time: timeStr
        };

        setLatestPayments(prev => [newPayment, ...prev].slice(0, 10));
      }

      setSalesChartData(prev => {
        const newData = [...prev, { time: timeStr, sales: saleAmount }];
        return newData.slice(-30); // Keep last 30 points
      });

      setCumulativeRevenueData(prev => {
        const lastRevenue = prev.length > 0 ? prev[prev.length - 1].sales : 0;
        const newData = [...prev, { time: timeStr, sales: lastRevenue + saleAmount }];
        return newData.slice(-30);
      });

    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (salesCount > 0) {
      setAverageSale(totalRevenue / salesCount);
    }
  }, [totalRevenue, salesCount]);

  return {
    totalRevenue,
    cumulativeRevenueData,
    salesCount,
    averageSale,
    salesChartData,
    latestPayments,
  };
}
