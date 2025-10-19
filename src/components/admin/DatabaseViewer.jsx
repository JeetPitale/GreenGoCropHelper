import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Database } from "lucide-react";

const TABLES = [
  "profiles",
  "user_roles",
  "crops",
  "transactions",
  "market_prices",
  "weather_alerts",
  "soil_analysis",
  "expert_queries",
  "wholesaler_requests",
];

const DatabaseViewer = () => {
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState("profiles");
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  const fetchTableData = async (tableName) => {
    setLoading(true);
    try {
      const { data: tableData, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(100);

      if (error) throw error;

      if (tableData && tableData.length > 0) {
        setColumns(Object.keys(tableData[0]));
        setData(tableData);
      } else {
        setColumns([]);
        setData([]);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch data",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-6 w-6" />
            Database Viewer
          </h2>
          <p className="text-muted-foreground">
            View all data stored in the database
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Table</CardTitle>
          <CardDescription>Choose a table to view its data</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger>
              <SelectValue placeholder="Select a table" />
            </SelectTrigger>
            <SelectContent>
              {TABLES.map((table) => (
                <SelectItem key={table} value={table}>
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No data found in this table</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTable}</CardTitle>
            <CardDescription>{data.length} records found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index}>
                      {columns.map((column) => (
                        <TableCell key={column}>
                          {typeof row[column] === "object" && row[column] !== null
                            ? JSON.stringify(row[column])
                            : String(row[column] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DatabaseViewer;
