package cineplex.view;

import cineplex.dao.UpcomingMovieDAO;
import cineplex.model.UpcomingMovie;

import javax.swing.*;
import java.awt.*;
import java.sql.Date;

public class UpcomingMoviesManagementView extends JFrame {
    private final UpcomingMovieDAO dao = new UpcomingMovieDAO();
    private final DefaultListModel<UpcomingMovie> listModel = new DefaultListModel<>();
    private final JList<UpcomingMovie> list = new JList<>(listModel);
    private final JTextField txtName = new JTextField();
    private final JTextField txtDate = new JTextField("2026-08-15");
    private final JTextField txtPoster = new JTextField("resources/images/posters/karuppu.jpg");
    private final JTextField txtTrailer = new JTextField("https://example.com/trailer");
    private final JComboBox<String> cmbStatus = new JComboBox<>(new String[]{"COMING_SOON", "TRENDING", "RELEASED"});
    private final JTextArea txtTeaser = new JTextArea(4, 20);

    public UpcomingMoviesManagementView() {
        setTitle("Upcoming Movies Management");
        setSize(900, 600);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        getContentPane().setBackground(new Color(16,16,16)); setLayout(new BorderLayout(10, 10));

        list.setCellRenderer((l, value, i, s, f) -> new JLabel(value.getMovieName() + " | " + value.getStatus() + " | Notify: " + value.getNotifyCount()));
        add(new JScrollPane(list), BorderLayout.WEST);

        JPanel form = new JPanel(new GridLayout(0, 2, 6, 6));
        form.add(new JLabel("Movie Name")); form.add(txtName);
        form.add(new JLabel("Release Date (YYYY-MM-DD)")); form.add(txtDate);
        form.add(new JLabel("Poster URL/Path")); form.add(txtPoster);
        form.add(new JLabel("Trailer URL")); form.add(txtTrailer);
        form.add(new JLabel("Status")); form.add(cmbStatus);
        form.add(new JLabel("Teaser")); form.add(new JScrollPane(txtTeaser));
        add(form, BorderLayout.CENTER);

        JPanel actions = new JPanel();
        JButton addBtn = new JButton("Add");
        JButton updBtn = new JButton("Update");
        JButton delBtn = new JButton("Delete");
        actions.add(addBtn); actions.add(updBtn); actions.add(delBtn);
        add(actions, BorderLayout.SOUTH);

        list.addListSelectionListener(e -> {
            UpcomingMovie m = list.getSelectedValue();
            if (m != null) {
                txtName.setText(m.getMovieName());
                txtDate.setText(m.getExpectedReleaseDate() != null ? m.getExpectedReleaseDate().toString() : "");
                txtPoster.setText(m.getPosterUrl());
                txtTrailer.setText(m.getTrailerUrl());
                cmbStatus.setSelectedItem(m.getStatus());
                txtTeaser.setText(m.getTeaserDescription());
            }
        });

        addBtn.addActionListener(e -> {
            UpcomingMovie m = readForm();
            if (m != null && dao.addUpcomingMovie(m)) refresh();
        });
        updBtn.addActionListener(e -> {
            UpcomingMovie selected = list.getSelectedValue();
            if (selected == null) return;
            UpcomingMovie m = readForm();
            if (m != null) {
                m.setUpcomingId(selected.getUpcomingId());
                if (dao.updateUpcomingMovie(m)) refresh();
            }
        });
        delBtn.addActionListener(e -> {
            UpcomingMovie selected = list.getSelectedValue();
            if (selected != null && dao.deleteUpcomingMovie(selected.getUpcomingId())) refresh();
        });

        refresh();
    }

    private UpcomingMovie readForm() {
        try {
            UpcomingMovie m = new UpcomingMovie();
            m.setMovieName(txtName.getText().trim());
            m.setExpectedReleaseDate(Date.valueOf(txtDate.getText().trim()));
            m.setPosterUrl(txtPoster.getText().trim());
            m.setTrailerUrl(txtTrailer.getText().trim());
            m.setStatus((String) cmbStatus.getSelectedItem());
            m.setTeaserDescription(txtTeaser.getText().trim());
            if (m.getMovieName().isEmpty()) return null;
            return m;
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Invalid form data.", "Error", JOptionPane.ERROR_MESSAGE);
            return null;
        }
    }

    private void refresh() {
        listModel.clear();
        for (UpcomingMovie m : dao.getAllUpcomingMovies()) listModel.addElement(m);
    }
}

