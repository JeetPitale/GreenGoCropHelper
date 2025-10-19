import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, TrendingUp, Users } from "lucide-react";

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    totalValue: 0,
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("admin_transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        () => {
          fetchTransactions();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from("transactions")
      .select(`
        *,
        farmer_profile:profiles!transactions_farmer_id_fkey(full_name, phone),
        wholesaler_profile:profiles!transactions_wholesaler_id_fkey(full_name, phone),
        crops(crop_name)
      `)
      .order("created_at", { ascending: false });

    if (data) setTransactions(data);
  };

  const fetchStats = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("quantity_kg, total_amount");

    if (data) {
      setStats({
        totalTransactions: data.length,
        totalVolume: data.reduce(
          (sum, t) =>
            sum +
            (typeof t.quantity_kg === "string"
              ? parseFloat(t.quantity_kg)
              : t.quantity_kg || 0),
          0
        ),
        totalValue: data.reduce(
          (sum, t) =>
            sum +
            (typeof t.total_amount === "string"
              ? parseFloat(t.total_amount)
              : t.total_amount || 0),
          0
        ),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">All Transactions</h2>
        <p className="text-muted-foreground">
          View and monitor all platform transactions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>

        {/* Total Volume */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalVolume.toFixed(2)} kg
            </div>
          </CardContent>
        </Card>

        {/* Total Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Complete list of all platform transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No transactions found
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {transaction.crop_name}
                        </CardTitle>
                        <CardDescription>
                          <div className="space-y-1 mt-2">
                            <p>
                              Farmer:{" "}
                              {transaction.farmer_profile?.full_name || "N/A"}
                            </p>
                            <p>
                              Wholesaler:{" "}
                              {transaction.wholesaler_profile?.full_name ||
                                "N/A"}
                            </p>
                          </div>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          ₹{parseFloat(transaction.total_amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(
                            transaction.transaction_date
                          ).toLocaleDateString()}
                        </p>
                        <Badge className="mt-2" variant="secondary">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-medium">
                          {transaction.quantity_kg} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Price per kg</p>
                        <p className="font-medium">
                          ₹{parseFloat(transaction.price_per_kg).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Farmer Phone</p>
                        <p className="font-medium">
                          {transaction.farmer_profile?.phone || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Wholesaler Phone</p>
                        <p className="font-medium">
                          {transaction.wholesaler_profile?.phone || "N/A"}
                        </p>
                      </div>
                    </div>

                    {transaction.notes && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground font-medium">
                          Notes:
                        </p>
                        <p className="text-sm">{transaction.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTransactions;
