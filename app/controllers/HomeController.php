<?php

class HomeController
{
    public function index()
    {
        $profiles = profile_photos(ProfileModel::all());
        $gallery = GalleryModel::all();
        $destinations = DestinationModel::all();
        $videos = VideoModel::all();
        $feedbacks = FeedbackModel::approved();
        $settings = ['site_title' => SettingModel::get('site_title', 'KKL Informatika UPGRIS 2026'), 'logo' => SettingModel::get('logo', '')];
        view('home', compact('profiles', 'gallery', 'destinations', 'videos', 'feedbacks', 'settings'));
    }

    public function feedback()
    {
        csrf_verify();
        // Honeypot check against automated spam bots
        if (trim((string)($_POST['website_url'] ?? '')) !== '') {
            redirect('/?feedback_sent=1#feedback');
        }
        $now = time();
        $lastSent = (int)($_SESSION['last_feedback_at'] ?? 0);
        if ($now - $lastSent < 15) {
            redirect('/?feedback_error=1#feedback');
        }
        $name = trim((string)($_POST['name'] ?? ''));
        $rating = filter_var($_POST['rating'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 5]]);
        $message = trim((string)($_POST['message'] ?? ''));
        if (!valid_text($name, 100) || $rating === false || !valid_text($message, 1000)) {
            redirect('/?feedback_error=1#feedback');
        }
        $_SESSION['last_feedback_at'] = $now;
        FeedbackModel::insert($name, $rating, $message);
        redirect('/?feedback_sent=1#feedback');
    }

    public function feedbackRedirect()
    {
        redirect('/#feedback');
    }
}
