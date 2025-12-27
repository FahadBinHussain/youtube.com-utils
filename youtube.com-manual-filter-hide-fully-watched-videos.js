// ==UserScript==
// @name         YouTube History: Filter All (Manual)
// @namespace    http://tampermonkey.net/
// @version      15.0
// @description  Click button to hide ALL fully watched videos (no timestamp) currently on page. No background tasks.
// @author       You
// @match        https://www.youtube.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 1. CSS: Cleanly collapse hidden videos so they don't take up space
    const css = `
        /* Collapse hidden videos to almost nothing to prevent scroll bugs */
        .userscript-hidden-final {
            contain: strict;
            min-height: 0 !important;
            height: 1px !important;
            margin: 0 !important;
            padding: 0 !important;
            opacity: 0 !important;
            pointer-events: none !important;
            overflow: hidden !important;
        }

        /* The Manual Trigger Button */
        #yt-manual-filter-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 99999;
            padding: 15px 20px;
            background-color: #cc0000;
            color: white;
            font-family: Roboto, Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            transition: background 0.2s;
        }
        #yt-manual-filter-btn:hover { background-color: #aa0000; }
        #yt-manual-filter-btn:active { transform: translateY(2px); }
    `;

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);

    // 2. The Filter Logic (Runs ONLY when clicked)
    function runFilterOnce() {
        console.log(">>> Running Filter on ALL loaded videos... <<<");

        // Use the exact selector that worked for you
        const selector = 'a.yt-lockup-view-model__content-image';
        const links = document.querySelectorAll(selector);

        if (links.length === 0) {
            alert("No videos found. Make sure you are on the History page and videos are loaded.");
            return;
        }

        let hiddenCount = 0;

        links.forEach((link) => {
            const url = link.href;

            // Check for Timestamp (&t= or ?t=)
            // If it has a timestamp, it is partially watched -> KEEP
            // If NO timestamp -> HIDE
            const hasTimestamp = /[?&]t=\d+/.test(url);

            // Find the parent container to hide
            // Tries 'ytd-video-renderer' first, falls back to 'yt-lockup-view-model'
            let container = link.closest('ytd-video-renderer') || link.closest('yt-lockup-view-model');

            if (!container) return; // Skip if structure is weird

            if (!hasTimestamp) {
                // HIDE IT
                container.classList.add('userscript-hidden-final');
                hiddenCount++;
            } else {
                // KEEP IT (Ensure it's visible in case you re-run)
                container.classList.remove('userscript-hidden-final');
            }
        });

        console.log(`Filter Complete. Hidden: ${hiddenCount} / Total: ${links.length}`);

        // Update button text briefly to show success
        const btn = document.getElementById('yt-manual-filter-btn');
        const originalText = btn.innerText;
        btn.innerText = `HIDDEN ${hiddenCount}`;
        setTimeout(() => { btn.innerText = originalText; }, 2000);
    }

    // 3. Create the Button
    function createButton() {
        if (document.getElementById('yt-manual-filter-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'yt-manual-filter-btn';
        btn.innerText = "HIDE WATCHED";
        btn.onclick = runFilterOnce;

        console.debug("NeverSeen: Adding manual filter button.");

        document.body.appendChild(btn);
    }

    // Helper: Only keep the button on the History page
    function isHistoryPage() {
        // Use pathname to avoid query params. Handles leading/trailing slashes.
        return window.location.pathname.replace(/\/+$/, '') === '/feed/history';
    }

    // Remove the button if it exists
    function removeButton() {
        const btn = document.getElementById('yt-manual-filter-btn');
        if (btn) btn.remove();
        console.debug("NeverSeen: Removed manual filter button.");
    }

    // Add button after a slight delay to ensure page init, but only on the History page
    function maybeCreateButton() {
        if (isHistoryPage()) {
            setTimeout(createButton, 1500);
        } else {
            removeButton();
        }
    }

    // Initial run
    maybeCreateButton();

    // YouTube is an SPA; hook into navigation events to add/remove the button dynamically
    // 'yt-navigate-finish' is fired by YouTube when client-side navigation completes.
    window.addEventListener('yt-navigate-finish', maybeCreateButton);
    // Fallbacks for browsers or platforms that may not emit the YouTube custom event
    window.addEventListener('popstate', maybeCreateButton);

})();
