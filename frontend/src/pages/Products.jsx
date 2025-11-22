import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import ProductTable from "../components/ProductTable";
import AddProduct from "../components/AddProduct";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const navigate = useNavigate();

  const loadProducts = async () => {
  const res = await api.get("/api/products", {
    params: { search, category },
  });

  const list = res.data.data || res.data || [];
  setProducts(list);
};

  useEffect(() => {
    loadProducts();
  },[]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("csvFile", file);

    await api.post("/api/import", formData);
    loadProducts();
  };

  const exportCSV = () => {
    window.open("http://localhost:5000/api/export");
  };

  return (
    <div className="page">

      <div className="nav">
        <h2>Product Dashboard</h2>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>

      <div className="toolbar">
        <input
          className="search-bar"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="filter"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Mobile">Mobile</option>
          <option value="Shoes">Shoes</option>
          <option value="Laptop">Laptop</option>
        </select>

        <button className="search-btn" onClick={loadProducts}>Search</button>

        <button className="export-btn" onClick={exportCSV}>Export CSV</button>

        <label className="import-btn">
          Import CSV
          <input type="file" accept=".csv" onChange={handleImport} hidden />
        </label>
      </div>

      <AddProduct reload={loadProducts} />
      <ProductTable data={products} reload={loadProducts} />
    </div>
  );
}
