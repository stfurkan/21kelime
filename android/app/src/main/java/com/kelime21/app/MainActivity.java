package com.kelime21.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /**
     * Upper bound for the system font scale, in percent.
     *
     * Android applies the device's font size setting to the WebView as a
     * text zoom, which multiplies every computed font-size regardless of
     * the unit it was written in. The play board is a fixed geometry
     * surface -- one letter per box, all boxes on a single row -- so past
     * roughly 120% the letters no longer fit the tiles they sit in.
     *
     * Clamping keeps the "Large" setting working in full and only trims the
     * largest steps, so text still grows for readers who need it without
     * breaking the board.
     */
    private static final int MAX_TEXT_ZOOM = 120;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebSettings settings = getBridge().getWebView().getSettings();
        settings.setTextZoom(Math.min(settings.getTextZoom(), MAX_TEXT_ZOOM));
    }
}
