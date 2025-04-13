# Wallabag Cloud Proxy

This project aims to provide a seamless way to access your self-hosted Wallabag instance through a frontend application hosted on free cloud (so far Vercel). By utilizing Vercel's server-side API proxying, users can interact with their Wallabag instance without the need to expose ports 80/443, which can be challenging in certain environments.

## Features

- [x] Responsive design that works on desktop and mobile
- [x] View all your saved articles in different categories (unread, archived, starred)
- [x] Clean reading experience with original and simplified view options
- [x] View and manage annotations on your articles
- [x] Archive, star, and delete articles
- [x] Add new articles to your reading li
- [ ] Implement text highlighting and annotation creation
- [ ] Add search functionality for articles
- [ ] Support for tags and filtering by tags
- [ ] Dark mode toggle
- [ ] Reading progress tracking
- [ ] Offline reading support
- [ ] Mobile app using PWA capabili
- [ ] Reading statistics and insights
- [ ] Improved error handling

## Prerequisites

To use this application, you need:

1. A Wallabag instance (self-hosted or using a service provider)
2. API credentials from your Wallabag instance (Client ID and Client Secret)

## Deploy to Vercel

You can deploy your own instance of Wallabag Reader to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhonglonglong%2Fwallabag-cloud-proxy)

### Configuration

After deploying, you don't need to configure any environment variables in your Vercel project settings, the first screen will prompt you to input all the needed variables and store into your local storage in browser.

## Local Development

### Prerequisites

- Node.js 18.x or later
- npm or yarn

## How to Get Wallabag API Credentials

1. Log in to your Wallabag instance
2. Go to Settings > API clients management
3. Create a new client
4. Note the Client ID and Client Secret

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Wallabag](https://wallabag.org/) for their excellent read-it-later service
- [Next.js](https://nextjs.org/) for the React framework
- [shadcn/ui](https://ui.shadcn.com/) for the UI components
