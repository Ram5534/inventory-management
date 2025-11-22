import { useState } from "react";
import api from "../api";

export default function AddProduct({ reload }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [stock, setStock] = useState("");

  const addProduct = async (e) => {
    e.preventDefault();

    // Validate
    if (name.trim() === "" || category.trim() === "" || unit === "" || stock === "") {
      alert("Please fill all fields");
      return;
    }

    await api.post("/api/add-products", { 
      name, 
      category, 
      unit: Number(unit),    // 👉 FIXED
      stock: Number(stock)   // 👉 FIXED
    });

    setName("");
    setCategory("");
    setUnit("");
    setStock("");

    reload();
  };

  return (
    <form className="add-form" onSubmit={addProduct}>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <input
        placeholder="Unit"
        type="number"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
      />

      <input
        placeholder="Stock"
        type="number"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
      />

      <button type="submit">Add</button>
    </form>
  );
}
