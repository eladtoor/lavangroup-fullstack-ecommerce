"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    args?: object;
    accessibilityWidgetLoaded?: boolean;
  }
}

export default function AccessibilityWidget() {
  useEffect(() => {
    // Check if accessibility widget is already loaded
    if (window.accessibilityWidgetLoaded) {
      return;
    }

    // Mark as loaded to prevent duplicate loading
    window.accessibilityWidgetLoaded = true;

    // Configure VEE accessibility widget
    window.args = {
      sitekey: "cffac76baf66d7c497f64b426be12252",
      position: "Right",
      language: "HE",
      container: "",
      icon: "",
      access: "https://vee-crm.com/",
      styles: {
        primary_color: "#f69623",
        secondary_color: "#000000",
        background_color: "#f6f6f6",
        primary_text_color: "#636363",
        headers_text_color: "#105675",
        primary_font_size: 14,
        slider_left_color: "#f69623",
        slider_right_color: "#177fab",
        icon_vertical_position: "top",
        icon_offset_top: 200,
        icon_offset_bottom: 0,
        highlight_focus_color: "#177fab",
        toggler_icon_color: "#ffffff",
      },
      links: {
        acc_policy: "",
        additional_link: "https://vee.co.il/pricing/",
      },
      options: {
        open: false,
        aaa: false,
        hide_tablet: false,
        hide_mobile: false,
        button_size_tablet: 44,
        button_size_mobile: 34,
        position_tablet: "Right",
        position_mobile: "Right",
        icon_vertical_position_tablet: "top",
        icon_vertical_position_mobile: "top",
        icon_offset_top_tablet: 100,
        icon_offset_bottom_tablet: 0,
        icon_offset_top_mobile: 100,
        icon_offset_bottom_mobile: 0,
        keyboard_shortcut: true,
        hide_purchase_link: false,
        display_checkmark_icon: false,
        active_toggler_color: "#118f38",
      },
      exclude: [],
    };

    // Load VEE accessibility script
    const existingScript = document.querySelector('script[src*="vee-crm.com"]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://vee-crm.com/js/";
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.setAttribute("data-cfasync", "true");
      script.setAttribute("id", "accessibility-widget-script");
      document.body.appendChild(script);
    }
  }, []);

  return null;
}
