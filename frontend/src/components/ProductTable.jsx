import { useState } from "react";
import api from "../api";

export default function ProductTable({ data, reload }) {
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const startEdit = (product) => {
  setEditId(product.id);
  setEditData({
    name: product.name,
    unit: product.unit,
    category: product.category,
    stock: product.stock
  });
};

const saveEdit = async () => {
  const updatedData = {
    name: editData.name,
    unit: Number(editData.unit),
    category: editData.category,
    stock: Number(editData.stock),
  };

  await api.put(`/api/products/${editId}`, updatedData);
  setEditId(null);
  reload();
};

 
  const deleteProduct = async (id) => {
    await api.delete(`/api/products/${id}`);
    reload();
  };

  return (
    <table className="product-table">

      <thead>
        <tr>
          <th>Name</th>
          <th>Unit</th>
          <th>Category</th>
          <th>Stock</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {data.map((p) =>
          editId === p.id ? (
            <tr key={p.id}>
  <td>
    <input
      value={editData.name}
      onChange={(e) =>
        setEditData({ ...editData, name: e.target.value })
      }
    />
  </td>

  <td>
    <input
      value={editData.unit}
      onChange={(e) =>
        setEditData({ ...editData, unit: e.target.value })
      }
    />
  </td>

  <td>
    <input
      value={editData.category}
      onChange={(e) =>
        setEditData({ ...editData, category: e.target.value })
      }
    />
  </td>

  <td>
    <input
      value={editData.stock}
      type="number"
      onChange={(e) =>
        setEditData({ ...editData, stock: Number(e.target.value) })
      }
    />
  </td>

  <td>
    <button className="save-btn" onClick={saveEdit}>Save</button>
    <button className="cancel-btn" onClick={() => setEditId(null)}>
      Cancel
    </button>
  </td>
</tr>

          ) : (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.unit}</td>
                <td>{p.category}</td>
              <td className={Number(p.stock) === 0 ? "red" : "green"}>
                {Number(p.stock) === 0 ? "Out of Stock" : "In Stock"}
              </td>

              

              <td>
                <button className="edit-btn" onClick={() => startEdit(p)}>
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() => deleteProduct(p.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          )
        )}
      </tbody>

    </table>
  );
}
