package view;

import controller.SnackController;
import model.Booking;
import model.Snack;
import model.SnackOrder;
import util.RoundedButton;
import util.RoundedPanel;
import util.ThemeUtil;
import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.util.ArrayList;
import java.util.List;

public class SnackView extends JPanel {

    private SnackController snackController;
    private Booking currentBooking;
    
    private JTable snackTable;
    private DefaultTableModel tableModel;
    private JTextField searchField;
    private JLabel totalLabel;
    
    private List<Snack> allSnacks;
    private List<SnackOrder> cart;
    private double cartTotal = 0.0;
    
    // Callback to proceed to next screen
    private Runnable onCheckout;

    public SnackView(Booking booking, Runnable onCheckout) {
        this.currentBooking = booking;
        this.onCheckout = onCheckout;
        this.snackController = new SnackController();
        this.cart = new ArrayList<>();
        
        initUI();
        loadData();
    }

    private void initUI() {
        setLayout(new BorderLayout(20, 20));
        setBackground(ThemeUtil.BACKGROUND_DARK);
        setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));

        // Top Panel: Header & Search
        RoundedPanel topPanel = new RoundedPanel(20, new BorderLayout(10, 10));
        topPanel.setBackground(ThemeUtil.PANEL_BACKGROUND);
        topPanel.setBorder(BorderFactory.createEmptyBorder(15, 20, 15, 20));
        
        JLabel headerLabel = new JLabel("Grab Some Snacks!");
        headerLabel.setFont(ThemeUtil.FONT_HEADER);
        headerLabel.setForeground(ThemeUtil.ACCENT_GOLD);
        
        searchField = new JTextField(20);
        searchField.setBorder(BorderFactory.createTitledBorder(
                BorderFactory.createLineBorder(ThemeUtil.TEXT_SECONDARY), 
                "Search Snacks", 
                0, 0, ThemeUtil.FONT_SMALL, ThemeUtil.TEXT_SECONDARY));
        
        searchField.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {
            public void insertUpdate(javax.swing.event.DocumentEvent e) { filter(); }
            public void removeUpdate(javax.swing.event.DocumentEvent e) { filter(); }
            public void changedUpdate(javax.swing.event.DocumentEvent e) { filter(); }
        });

        topPanel.add(headerLabel, BorderLayout.WEST);
        topPanel.add(searchField, BorderLayout.EAST);
        add(topPanel, BorderLayout.NORTH);

        // Center Panel: Table
        String[] columns = {"ID", "Snack Name", "Category", "Price (₹)", "Stock"};
        tableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) { return false; }
        };
        
        snackTable = new JTable(tableModel);
        ThemeUtil.styleTable(snackTable);
        
        JScrollPane scrollPane = new JScrollPane(snackTable);
        scrollPane.setBorder(BorderFactory.createLineBorder(ThemeUtil.PANEL_BACKGROUND));
        add(scrollPane, BorderLayout.CENTER);

        // Bottom Panel: Actions & Summary
        RoundedPanel bottomPanel = new RoundedPanel(20, new BorderLayout());
        bottomPanel.setBackground(ThemeUtil.PANEL_BACKGROUND);
        bottomPanel.setBorder(BorderFactory.createEmptyBorder(15, 20, 15, 20));
        
        JPanel actionsPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 15, 0));
        actionsPanel.setBackground(ThemeUtil.PANEL_BACKGROUND);
        
        RoundedButton btnAdd = ThemeUtil.createSecondaryButton("Add to Cart");
        
        JSpinner qtySpinner = new JSpinner(new SpinnerNumberModel(1, 1, 10, 1));
        qtySpinner.setPreferredSize(new Dimension(60, 35));
        
        actionsPanel.add(new JLabel("Qty: "));
        actionsPanel.add(qtySpinner);
        actionsPanel.add(btnAdd);
        
        JPanel summaryPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 20, 0));
        summaryPanel.setBackground(ThemeUtil.PANEL_BACKGROUND);
        
        totalLabel = new JLabel("Cart Total: ₹0.00");
        totalLabel.setFont(ThemeUtil.FONT_SUBHEADER);
        totalLabel.setForeground(ThemeUtil.TEXT_PRIMARY);
        
        RoundedButton btnCheckout = ThemeUtil.createPrimaryButton("Proceed to Payment");
        
        summaryPanel.add(totalLabel);
        summaryPanel.add(btnCheckout);

        bottomPanel.add(actionsPanel, BorderLayout.WEST);
        bottomPanel.add(summaryPanel, BorderLayout.EAST);
        add(bottomPanel, BorderLayout.SOUTH);

        // Event Listeners
        btnAdd.addActionListener(e -> {
            int selectedRow = snackTable.getSelectedRow();
            if (selectedRow >= 0) {
                int snackId = (int) tableModel.getValueAt(selectedRow, 0);
                int qty = (int) qtySpinner.getValue();
                addToCart(snackId, qty);
            } else {
                JOptionPane.showMessageDialog(this, "Please select a snack first.", "Warning", JOptionPane.WARNING_MESSAGE);
            }
        });

        btnCheckout.addActionListener(e -> {
            currentBooking.setSnackOrders(cart);
            double ticketTotal = currentBooking.getTotalAmount();
            currentBooking.setTotalAmount(ticketTotal + cartTotal); // Update total including snacks
            if (onCheckout != null) onCheckout.run();
        });
    }

    private void loadData() {
        allSnacks = snackController.getAvailableSnacks();
        populateTable(allSnacks);
    }

    private void filter() {
        String query = searchField.getText();
        List<Snack> filtered = snackController.filterSnacks(allSnacks, query);
        populateTable(filtered);
    }

    private void populateTable(List<Snack> snacks) {
        tableModel.setRowCount(0);
        for (Snack s : snacks) {
            tableModel.addRow(new Object[]{
                s.getSnackId(), s.getSnackName(), s.getCategory(), s.getPrice(), s.getAvailableQuantity()
            });
        }
    }

    private void addToCart(int snackId, int qty) {
        Snack selectedSnack = allSnacks.stream().filter(s -> s.getSnackId() == snackId).findFirst().orElse(null);
        if (selectedSnack != null) {
            if (qty > selectedSnack.getAvailableQuantity()) {
                JOptionPane.showMessageDialog(this, "Not enough stock available!", "Error", JOptionPane.ERROR_MESSAGE);
                return;
            }
            
            // Check if already in cart
            SnackOrder existingOrder = cart.stream().filter(o -> o.getSnackId() == snackId).findFirst().orElse(null);
            
            if (existingOrder != null) {
                int newQty = existingOrder.getQuantity() + qty;
                if(newQty > selectedSnack.getAvailableQuantity()) {
                    JOptionPane.showMessageDialog(this, "Exceeds available stock!", "Error", JOptionPane.ERROR_MESSAGE);
                    return;
                }
                existingOrder.setQuantity(newQty);
                existingOrder.setTotalPrice(newQty * selectedSnack.getPrice());
            } else {
                SnackOrder newOrder = new SnackOrder();
                newOrder.setSnack(selectedSnack);
                newOrder.setQuantity(qty);
                newOrder.setTotalPrice(qty * selectedSnack.getPrice());
                cart.add(newOrder);
            }
            
            updateCartTotal();
            JOptionPane.showMessageDialog(this, qty + "x " + selectedSnack.getSnackName() + " added to cart.", "Success", JOptionPane.INFORMATION_MESSAGE);
        }
    }

    private void updateCartTotal() {
        cartTotal = cart.stream().mapToDouble(SnackOrder::getTotalPrice).sum();
        totalLabel.setText(String.format("Cart Total: ₹%.2f", cartTotal));
    }
}
