import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TalkBridge AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4DFFC3),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF080B14),
        useMaterial3: true,
      ),
      home: const MainShell(),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _selectedIndex = 0;

  final List<Widget> _screens = const [
    LandingScreen(),
    UrgentScreen(),
    MessageLogScreen(),
    UsageScreen(),
    ProductsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        backgroundColor: const Color(0xFF0F1624),
        indicatorColor: const Color(0xFF162033),
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) => setState(() => _selectedIndex = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.warning_amber_outlined), label: 'Urgent'),
          NavigationDestination(icon: Icon(Icons.forum_outlined), label: 'Messages'),
          NavigationDestination(icon: Icon(Icons.insights_outlined), label: 'Usage'),
          NavigationDestination(icon: Icon(Icons.inventory_2_outlined), label: 'Products'),
        ],
      ),
    );
  }
}

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 24),
            _buildHero(),
            const SizedBox(height: 24),
            _buildInboxPreview(),
            const SizedBox(height: 24),
            _buildFeatureGrid(),
            const SizedBox(height: 24),
            _buildPricingCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: const Color(0xFF4DFFC3),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.account_tree_outlined, color: Color(0xFF080B14), size: 18),
        ),
        const SizedBox(width: 10),
        const Text(
          'TalkBridge AI',
          style: TextStyle(color: Color(0xFFF0F4FF), fontSize: 20, fontWeight: FontWeight.w700),
        ),
      ],
    );
  }

  Widget _buildHero() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF4DFFC3).withAlpha(120)),
            borderRadius: BorderRadius.circular(999),
          ),
          child: const Text(
            'AI COMMUNICATION BRIDGE',
            style: TextStyle(color: Color(0xFF4DFFC3), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2),
          ),
        ),
        const SizedBox(height: 16),
        const Text('Every comment.', style: TextStyle(color: Color(0xFFF0F4FF), fontSize: 38, fontWeight: FontWeight.w700, height: 1.05)),
        const Text('Instantly handled.', style: TextStyle(color: Color(0xFF4DFFC3), fontSize: 38, fontWeight: FontWeight.w700, height: 1.05)),
        const SizedBox(height: 12),
        const Text('TalkBridge connects Instagram, TikTok, and WhatsApp into one AI inbox for busy Nairobi SMEs.', style: TextStyle(color: Color(0xFF7A8BAD), fontSize: 15, height: 1.5)),
        const SizedBox(height: 18),
        Row(
          children: [
            Expanded(
              child: ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4DFFC3),
                  foregroundColor: const Color(0xFF080B14),
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
                child: const Text('Get started free'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFF0F4FF),
                  side: const BorderSide(color: Color(0xFF1C2640)),
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
                child: const Text('See how it works'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildInboxPreview() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F1624),
        border: Border.all(color: const Color(0xFF1C2640)),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('LIVE INBOX', style: TextStyle(color: Color(0xFF4DFFC3), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.1)),
              const SizedBox(width: 8),
              Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF4DFFC3), shape: BoxShape.circle)),
            ],
          ),
          const SizedBox(height: 12),
          _buildInboxRow(accent: const Color(0xFFFF0050), title: '@user_ke', body: 'Where is my order 😡', badge: 'URGENT', badgeColor: const Color(0xFFFF6B6B)),
          const SizedBox(height: 10),
          _buildInboxRow(accent: const Color(0xFFE1306C), title: '@nairobi_fan', body: 'Do you ship to Uganda?', badge: 'REPLIED', badgeColor: const Color(0xFF4DFFC3)),
          const SizedBox(height: 10),
          _buildInboxRow(accent: const Color(0xFF25D366), title: 'WhatsApp', body: 'LOVE this hoodie 🔥🔥', badge: 'REPLIED', badgeColor: const Color(0xFF4DFFC3)),
          const SizedBox(height: 14),
          Row(
            children: [
              Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF7B6EF6), shape: BoxShape.circle)),
              const SizedBox(width: 8),
              const Text('AI is drafting a reply...', style: TextStyle(color: Color(0xFF7A8BAD), fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInboxRow({required Color accent, required String title, required String body, required String badge, required Color badgeColor}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: const Color(0xFF162033), borderRadius: BorderRadius.circular(16)),
      child: Row(
        children: [
          Container(width: 3, height: 38, color: accent),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Color(0xFF7A8BAD), fontSize: 12)),
                const SizedBox(height: 2),
                Text(body, style: const TextStyle(color: Color(0xFFF0F4FF), fontSize: 13)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(color: badgeColor.withAlpha(35), borderRadius: BorderRadius.circular(999)),
            child: Text(badge, style: TextStyle(color: badgeColor, fontSize: 11, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureGrid() {
    final features = [
      const _Feature('AI Message Triage', 'Every comment classified by intent and urgency in 200ms.', Icons.message_outlined),
      const _Feature('Swahili, Sheng & English', 'Built for how Nairobi actually communicates online.', Icons.language),
      const _Feature('Auto-Reply in 4 Seconds', 'Replies posted directly to your platforms via Zernio.', Icons.bolt_outlined),
      const _Feature('Urgent Alert System', 'High-urgency messages reach you via SMS instantly.', Icons.phone_android_outlined),
      const _Feature('Product Catalogue AI', 'AI knows your stock, prices, and sizes.', Icons.inventory_2_outlined),
      const _Feature('Usage Dashboard', 'Track every reply, token used and escalation in real time.', Icons.insights_outlined),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Everything your brand needs', style: TextStyle(color: Color(0xFFF0F4FF), fontSize: 22, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        const Text('Built for founders who need fast, clear support.', style: TextStyle(color: Color(0xFF7A8BAD), fontSize: 14)),
        const SizedBox(height: 12),
        Wrap(spacing: 12, runSpacing: 12, children: features.map((feature) => SizedBox(width: 160, child: _buildFeatureCard(feature))).toList()),
      ],
    );
  }

  Widget _buildFeatureCard(_Feature feature) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF0F1624), border: Border.all(color: const Color(0xFF1C2640)), borderRadius: BorderRadius.circular(20)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: const Color(0xFF4DFFC3).withAlpha(30), borderRadius: BorderRadius.circular(999)),
            child: Icon(feature.icon, color: const Color(0xFF4DFFC3), size: 20),
          ),
          const SizedBox(height: 12),
          Text(feature.title, style: const TextStyle(color: Color(0xFFF0F4FF), fontSize: 14, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(feature.description, style: const TextStyle(color: Color(0xFF7A8BAD), fontSize: 13, height: 1.45)),
        ],
      ),
    );
  }

  Widget _buildPricingCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: const Color(0xFF0F1624), border: Border.all(color: const Color(0xFF4DFFC3), width: 1.5), borderRadius: BorderRadius.circular(24)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Starter', style: TextStyle(color: Color(0xFFF0F4FF), fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: const [
              Text('Ksh 2,500', style: TextStyle(color: Color(0xFF4DFFC3), fontSize: 28, fontWeight: FontWeight.w700)),
              SizedBox(width: 6),
              Text('/month', style: TextStyle(color: Color(0xFF7A8BAD), fontSize: 14)),
            ],
          ),
          const SizedBox(height: 12),
          const _Bullet('Unlimited AI triage'),
          const _Bullet('3 connected channels'),
          const _Bullet('WhatsApp alerts'),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4DFFC3), foregroundColor: const Color(0xFF080B14), minimumSize: const Size.fromHeight(46), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
              child: const Text('Get started'),
            ),
          ),
        ],
      ),
    );
  }
}

class UrgentScreen extends StatelessWidget {
  const UrgentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF080B14),
      appBar: AppBar(backgroundColor: const Color(0xFF080B14), elevation: 0, title: const Text('Urgent Messages')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          _MessageCard(title: '@user_ke', subtitle: 'Where is my order 😡', badge: 'URGENT 9/10', accent: Color(0xFFFF6B6B)),
          SizedBox(height: 12),
          _MessageCard(title: '@kibandaski', subtitle: 'I need a refund for this hoodie', badge: 'ESCALATED', accent: Color(0xFFF5A623)),
        ],
      ),
    );
  }
}

class MessageLogScreen extends StatelessWidget {
  const MessageLogScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF080B14),
      appBar: AppBar(backgroundColor: const Color(0xFF080B14), elevation: 0, title: const Text('Message Log')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          _LogCard(platform: 'Instagram', message: 'Do you ship to Uganda?', status: 'Auto-replied'),
          SizedBox(height: 12),
          _LogCard(platform: 'TikTok', message: 'When will this be restocked?', status: 'Escalated'),
          SizedBox(height: 12),
          _LogCard(platform: 'WhatsApp', message: 'Love this hoodie!', status: 'Auto-replied'),
        ],
      ),
    );
  }
}

class UsageScreen extends StatelessWidget {
  const UsageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF080B14),
      appBar: AppBar(backgroundColor: const Color(0xFF080B14), elevation: 0, title: const Text('Usage & Analytics')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _StatCard(title: 'Total Replies', value: '1,284', accent: const Color(0xFF4DFFC3)),
          const SizedBox(height: 12),
          _StatCard(title: 'Urgent Escalations', value: '47', accent: const Color(0xFFF5A623)),
          const SizedBox(height: 12),
          _StatCard(title: 'Tokens Used', value: '284k', accent: const Color(0xFF7B6EF6)),
        ],
      ),
    );
  }
}

class ProductsScreen extends StatelessWidget {
  const ProductsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF080B14),
      appBar: AppBar(backgroundColor: const Color(0xFF080B14), elevation: 0, title: const Text('Product Catalogue')),
      body: GridView.count(
        padding: const EdgeInsets.all(16),
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.82,
        children: const [
          _ProductCard(name: 'Cargo Hoodie', price: 'Ksh 2,800', stock: 'IN STOCK'),
          _ProductCard(name: 'Street Tee', price: 'Ksh 1,200', stock: 'LOW STOCK'),
          _ProductCard(name: 'Joggers', price: 'Ksh 2,200', stock: 'OUT OF STOCK'),
        ],
      ),
    );
  }
}

class _Feature {
  const _Feature(this.title, this.description, this.icon);
  final String title;
  final String description;
  final IconData icon;
}

class _Bullet extends StatelessWidget {
  const _Bullet(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: Color(0xFF4DFFC3), size: 16),
          const SizedBox(width: 8),
          Text(text, style: const TextStyle(color: Color(0xFF7A8BAD), fontSize: 13)),
        ],
      ),
    );
  }
}

class _MessageCard extends StatelessWidget {
  const _MessageCard({super.key, required this.title, required this.subtitle, required this.badge, required this.accent});
  final String title;
  final String subtitle;
  final String badge;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF0F1624), border: Border.all(color: const Color(0xFF1C2640)), borderRadius: BorderRadius.circular(18)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(width: 10, height: 10, decoration: BoxDecoration(color: accent, shape: BoxShape.circle)),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(color: Color(0xFFF0F4FF), fontSize: 14, fontWeight: FontWeight.w700)),
              const Spacer(),
              Text(badge, style: TextStyle(color: accent, fontSize: 11, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 10),
          Text(subtitle, style: const TextStyle(color: Color(0xFF7A8BAD), fontSize: 14)),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: const Color(0xFF162033), borderRadius: BorderRadius.circular(12)),
            child: const Text('AI draft: “Sorry about the delay. We can process a replacement today.”', style: TextStyle(color: Color(0xFFF0F4FF), fontSize: 13)),
          ),
        ],
      ),
    );
  }
}

class _LogCard extends StatelessWidget {
  const _LogCard({super.key, required this.platform, required this.message, required this.status});
  final String platform;
  final String message;
  final String status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF0F1624), border: Border.all(color: const Color(0xFF1C2640)), borderRadius: BorderRadius.circular(18)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(platform, style: const TextStyle(color: Color(0xFFF0F4FF), fontSize: 14, fontWeight: FontWeight.w700)),
              const Spacer(),
              Text(status, style: const TextStyle(color: Color(0xFF4DFFC3), fontSize: 12, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 8),
          Text(message, style: const TextStyle(color: Color(0xFF7A8BAD), fontSize: 13)),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({super.key, required this.title, required this.value, required this.accent});
  final String title;
  final String value;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF0F1624), border: Border.all(color: const Color(0xFF1C2640)), borderRadius: BorderRadius.circular(18)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Color(0xFF7A8BAD), fontSize: 13)),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(color: accent, fontSize: 30, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({super.key, required this.name, required this.price, required this.stock});
  final String name;
  final String price;
  final String stock;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: const Color(0xFF0F1624), border: Border.all(color: const Color(0xFF1C2640)), borderRadius: BorderRadius.circular(18)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 84,
            decoration: BoxDecoration(color: const Color(0xFF162033), borderRadius: BorderRadius.circular(14)),
            child: const Center(child: Icon(Icons.inventory_2_outlined, color: Color(0xFF4DFFC3), size: 30)),
          ),
          const SizedBox(height: 10),
          Text(name, style: const TextStyle(color: Color(0xFFF0F4FF), fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(price, style: const TextStyle(color: Color(0xFF4DFFC3), fontWeight: FontWeight.w700)),
          const Spacer(),
          Text(stock, style: TextStyle(color: stock == 'OUT OF STOCK' ? const Color(0xFFFF6B6B) : stock == 'LOW STOCK' ? const Color(0xFFF5A623) : const Color(0xFF4DFFC3), fontSize: 12, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
