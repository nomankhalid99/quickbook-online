import {
  Box,
  IconButton,
  Typography,
  Modal,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { IoEye } from "react-icons/io5";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { GiCancel } from "react-icons/gi";

const InvoiceView = () => {
  const [invoiceData, setInvoiceData] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const handleOpen = (id) => {
    setOpen(!open);
    setSelectedId(id);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3000/getInvoices");
        console.log(response.data);
        setInvoiceData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const columns = [
    {
      field: "date",
      headerName: "Date",
      type: "number",
      headerAlign: "left",
      align: "left",
      width: 150,
    },
    {
      field: "no",
      headerName: "No.",
      type: "number",
      headerAlign: "left",
      align: "left",
      width: 170,
    },
    {
      field: "name",
      headerName: "Customer Name",
      width: 250,
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 110,
    },
    {
      headerName: "Details",
      headerAlign: "center",
      align: "center",
      width: 150,
      renderCell: ({ row }) => {
        const { id } = row;
        return (
          <Box margin="0 auto" display="flex" justifyContent="center" alignItems={"center"}>
            <IconButton onClick={() => handleOpen(id)}>
              <IoEye />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <Box className="flex justify-center items-center h-screen bg-neutral-200">
      <Box
        p={2}
        border={1}
        maxWidth={"90%"}
        borderColor="#F0F0F0"
        borderRadius={3}
        sx={{
          bgcolor: "white",
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: "bold",
            fontSize: "16px",
          },
        }}
      >
        <DataGrid
          rows={invoiceData.map((data) => ({ ...data, id: data.id || data.no }))}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[10]}
        />
        <Modal
          open={open}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box className="absolute top-2/4 md:w-2/5 w-4/5 left-2/4 h-96 overflow-y-auto transform -translate-x-2/4 -translate-y-2/4 bg-white p-4 rounded-md">
            <Box className="flex justify-between items-center">
              <Typography variant="" className="md:text-3xl text-2xl font-bold">
                Invoice Items
              </Typography>
              <IconButton onClick={handleOpen} className="mr-3">
                <GiCancel size={22} />
              </IconButton>
            </Box>
            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
              <Table >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Sr. No.</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Year</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Model</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Make</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Color</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>WIN No</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoiceData
                    .filter((leader) => leader.id === selectedId)
                    .map((leader) =>
                      leader.listItems.map((listItem, index) => (
                        <TableRow key={listItem.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{listItem.year}</TableCell>
                          <TableCell>{listItem.model}</TableCell>
                          <TableCell>{listItem.make}</TableCell>
                          <TableCell>{listItem.color}</TableCell>
                          <TableCell>{listItem.winNo}</TableCell>
                        </TableRow>
                      ))
                    )}
                </TableBody>
              </Table>
            </Typography>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
};

export default InvoiceView;
  