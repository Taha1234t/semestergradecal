# semestergradecalculators.com

Plain static site — every file here is exactly what gets served. No build
step, no Python, nothing to install. Cloudflare Pages just serves these
files as-is.

## Folder structure

```
index.html, about.html, contact.html, privacy.html   ← main site
style.css, script.js                                  ← main site styling/calculator

blog/
  index.html          ← the blog listing page (list of post cards)
  blog.css             ← shared styling for blog pages (header, footer, cards)
  blog-post.css         ← extra styling for individual post pages
  semester-grade-vs-final-grade/
    index.html          ← the actual post
  how-to-calculate-grade-before-final-exam/
    index.html
  weighted-vs-unweighted-grades/
    index.html
```

Each post is its own folder containing one `index.html` file. That's what
gives you the clean URL `/blog/semester-grade-vs-final-grade/` — the
folder name becomes the URL.

## Adding a new blog post (going forward)

1. Give me (Claude) the content — a Word doc, plain text, whatever you have.
2. I'll write the full `index.html` for the post, styled to match the rest
   of the blog, and give you the file.
3. You create a new folder inside `blog/` named after the post's slug
   (e.g. `blog/how-gpa-and-semester-grade-differ/`) and put that
   `index.html` inside it.
4. Open `blog/index.html` (the listing page) and add one more post card
   to it, copying the pattern of the existing cards — I'll give you the
   exact snippet to paste in when I hand you the new post.
5. Upload/commit both the new folder and the updated `blog/index.html` to
   your GitHub repo. Cloudflare Pages picks it up automatically.

There's no build step to run — whatever HTML file you commit is exactly
what goes live.

## Cloudflare Pages settings

Since there's no build step anymore, set your Cloudflare Pages project to:

| Setting | Value |
|---|---|
| Build command | *(leave empty)* |
| Build output directory | `/` |

This tells Cloudflare to just serve the repository's files directly,
without trying to run anything.
