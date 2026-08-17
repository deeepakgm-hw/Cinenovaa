package util;

import javax.swing.*;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.JTableHeader;
import java.awt.*;
import java.lang.reflect.Method;

public class ThemeUtil {
    
    // Cinematic Dark Theme Colors
    public static final Color BACKGROUND_DARK = new Color(18, 18, 20); // Very dark gray/black
    public static final Color PANEL_BACKGROUND = new Color(28, 28, 32); // Slightly lighter dark gray
    public static final Color ACCENT_RED = new Color(229, 9, 20); // Netflix red style
    public static final Color ACCENT_GOLD = new Color(212, 175, 55); // Cinematic gold
    public static final Color TEXT_PRIMARY = new Color(240, 240, 240); // Off-white
    public static final Color TEXT_SECONDARY = new Color(170, 170, 170); // Light gray
    public static final Color BUTTON_HOVER = new Color(250, 30, 40);

    // Fonts
    public static final Font FONT_HEADER = new Font("Segoe UI", Font.BOLD, 26);
    public static final Font FONT_SUBHEADER = new Font("Segoe UI", Font.BOLD, 18);
    public static final Font FONT_REGULAR = new Font("Segoe UI", Font.PLAIN, 14);
    public static final Font FONT_SMALL = new Font("Segoe UI", Font.PLAIN, 12);
    public static final Font FONT_TICKET = new Font("Monospaced", Font.PLAIN, 13);

    public static void setupModernLookAndFeel() {
        // Try FlatLaf first (when dependency is available in lib/), fallback to Nimbus.
        try {
            Class<?> flatDark = Class.forName("com.formdev.flatlaf.FlatDarkLaf");
            Method setup = flatDark.getMethod("setup");
            setup.invoke(null);
        } catch (Exception ignored) {
            try {
                for (UIManager.LookAndFeelInfo info : UIManager.getInstalledLookAndFeels()) {
                    if ("Nimbus".equals(info.getName())) {
                        UIManager.setLookAndFeel(info.getClassName());
                        break;
                    }
                }
            } catch (Exception ignored2) {
                // Keep default LAF
            }
        }
        applyDarkTheme();
    }

    /**
     * Applies global UI Manager settings for a dark theme across the application.
     */
    public static void applyDarkTheme() {
        // FlatLaf-specific keys are harmless if FlatLaf is unavailable.
        UIManager.put("Component.arc", 16);
        UIManager.put("Button.arc", 16);
        UIManager.put("TextComponent.arc", 14);
        UIManager.put("ProgressBar.arc", 16);
        UIManager.put("ScrollBar.thumbArc", 999);
        UIManager.put("ScrollBar.trackArc", 999);
        UIManager.put("ScrollBar.width", 10);
        UIManager.put("TitlePane.unifiedBackground", true);

        UIManager.put("Panel.background", BACKGROUND_DARK);
        UIManager.put("OptionPane.background", BACKGROUND_DARK);
        UIManager.put("OptionPane.messageForeground", TEXT_PRIMARY);
        UIManager.put("OptionPane.foreground", TEXT_PRIMARY);
        UIManager.put("Label.foreground", TEXT_PRIMARY);
        UIManager.put("Label.font", FONT_REGULAR);
        UIManager.put("Button.background", new Color(36, 36, 42));
        UIManager.put("Button.foreground", TEXT_PRIMARY);
        UIManager.put("Button.font", FONT_REGULAR);
        UIManager.put("Button.border", BorderFactory.createEmptyBorder(8, 14, 8, 14));
        UIManager.put("TextField.background", PANEL_BACKGROUND);
        UIManager.put("TextField.foreground", TEXT_PRIMARY);
        UIManager.put("TextField.caretForeground", TEXT_PRIMARY);
        UIManager.put("TextField.selectionBackground", ACCENT_RED);
        UIManager.put("TextField.selectionForeground", Color.WHITE);
        UIManager.put("PasswordField.background", PANEL_BACKGROUND);
        UIManager.put("PasswordField.foreground", TEXT_PRIMARY);
        UIManager.put("PasswordField.caretForeground", TEXT_PRIMARY);
        UIManager.put("PasswordField.selectionBackground", ACCENT_RED);
        UIManager.put("PasswordField.selectionForeground", Color.WHITE);
        UIManager.put("TextArea.background", PANEL_BACKGROUND);
        UIManager.put("TextArea.foreground", TEXT_PRIMARY);
        UIManager.put("TextArea.caretForeground", TEXT_PRIMARY);
        UIManager.put("TextArea.selectionBackground", ACCENT_RED);
        UIManager.put("TextArea.selectionForeground", Color.WHITE);
        UIManager.put("ComboBox.background", PANEL_BACKGROUND);
        UIManager.put("ComboBox.foreground", TEXT_PRIMARY);
        UIManager.put("ComboBox.selectionBackground", ACCENT_RED);
        UIManager.put("ComboBox.selectionForeground", Color.WHITE);
        UIManager.put("TabbedPane.background", BACKGROUND_DARK);
        UIManager.put("TabbedPane.foreground", TEXT_PRIMARY);
        UIManager.put("ScrollPane.background", BACKGROUND_DARK);
        UIManager.put("Viewport.background", BACKGROUND_DARK);
        UIManager.put("ScrollBar.thumb", new Color(70, 70, 78));
        UIManager.put("ScrollBar.track", new Color(24, 24, 28));
        UIManager.put("Table.background", PANEL_BACKGROUND);
        UIManager.put("Table.foreground", TEXT_PRIMARY);
        UIManager.put("Table.selectionBackground", new Color(64, 64, 74));
        UIManager.put("Table.selectionForeground", Color.WHITE);
        UIManager.put("Table.gridColor", new Color(40, 40, 45));
        UIManager.put("TableHeader.background", BACKGROUND_DARK);
        UIManager.put("TableHeader.foreground", ACCENT_GOLD);
        UIManager.put("TableHeader.font", FONT_SUBHEADER);
        UIManager.put("Separator.foreground", new Color(48, 48, 54));
        UIManager.put("ToolTip.background", new Color(38, 38, 44));
        UIManager.put("ToolTip.foreground", Color.WHITE);
    }

    /**
     * Creates a styled primary rounded button (e.g., Pay, Checkout)
     */
    public static RoundedButton createPrimaryButton(String text) {
        RoundedButton button = new RoundedButton(text, 15, ACCENT_RED, Color.WHITE);
        button.setFont(FONT_SUBHEADER);
        button.setHoverBackgroundColor(BUTTON_HOVER);
        button.setPreferredSize(new Dimension(200, 45));
        return button;
    }

    /**
     * Creates a styled secondary rounded button (e.g., Cancel, Back, Add to Cart)
     */
    public static RoundedButton createSecondaryButton(String text) {
        RoundedButton button = new RoundedButton(text, 15, PANEL_BACKGROUND.brighter(), TEXT_PRIMARY);
        button.setFont(FONT_REGULAR);
        button.setHoverBackgroundColor(new Color(60, 60, 65));
        button.setBorder(BorderFactory.createEmptyBorder(5, 15, 5, 15));
        return button;
    }

    /**
     * Styles a JTable for modern cinematic look
     */
    public static void styleTable(JTable table) {
        table.setRowHeight(30);
        table.setSelectionBackground(new Color(60, 60, 70));
        table.setSelectionForeground(Color.WHITE);
        table.setShowGrid(false);
        table.setIntercellSpacing(new Dimension(0, 0));
        
        JTableHeader header = table.getTableHeader();
        header.setPreferredSize(new Dimension(100, 40));
        header.setBorder(BorderFactory.createMatteBorder(0, 0, 1, 0, TEXT_SECONDARY));
        
        // Center text in cells
        DefaultTableCellRenderer centerRenderer = new DefaultTableCellRenderer();
        centerRenderer.setHorizontalAlignment(JLabel.CENTER);
        for(int i = 0; i < table.getColumnCount(); i++) {
            if(table.getColumnClass(i) == String.class || table.getColumnClass(i) == Double.class || table.getColumnClass(i) == Integer.class) {
                 table.getColumnModel().getColumn(i).setCellRenderer(centerRenderer);
            }
        }
    }
}
