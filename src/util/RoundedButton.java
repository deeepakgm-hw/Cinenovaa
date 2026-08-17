package util;

import javax.swing.*;
import java.awt.*;
import java.awt.geom.RoundRectangle2D;

public class RoundedButton extends JButton {
    private int radius;
    private Color hoverBackgroundColor;
    private Color pressedBackgroundColor;

    public RoundedButton(String text, int radius, Color bgColor, Color fgColor) {
        super(text);
        this.radius = radius;
        this.setBackground(bgColor);
        this.setForeground(fgColor);
        this.setFocusPainted(false);
        this.setContentAreaFilled(false);
        this.setBorderPainted(false);
        this.setCursor(new Cursor(Cursor.HAND_CURSOR));
        
        // Default hover and press colors
        this.hoverBackgroundColor = bgColor.brighter();
        this.pressedBackgroundColor = bgColor.darker();

        addMouseListener(new java.awt.event.MouseAdapter() {
            @Override
            public void mouseEntered(java.awt.event.MouseEvent evt) {
                setBackground(hoverBackgroundColor);
            }
            @Override
            public void mouseExited(java.awt.event.MouseEvent evt) {
                setBackground(bgColor);
            }
            @Override
            public void mousePressed(java.awt.event.MouseEvent evt) {
                setBackground(pressedBackgroundColor);
            }
            @Override
            public void mouseReleased(java.awt.event.MouseEvent evt) {
                setBackground(hoverBackgroundColor);
            }
        });
    }

    public void setHoverBackgroundColor(Color hoverBackgroundColor) {
        this.hoverBackgroundColor = hoverBackgroundColor;
    }

    public void setPressedBackgroundColor(Color pressedBackgroundColor) {
        this.pressedBackgroundColor = pressedBackgroundColor;
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        
        g2.setColor(getBackground());
        g2.fill(new RoundRectangle2D.Float(0, 0, getWidth(), getHeight(), radius, radius));
        
        super.paintComponent(g);
        g2.dispose();
    }
}
